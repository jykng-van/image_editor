export default class ImageEditor{
    canvas; //the canvas object
    ctx; //2nd context of the canvas
    img; //the image being modified
    mime_type;

    adjusted_ratio; //non-zoom ratio of the image based on sizing to meet the max dimension
    ratio; //the zoom ratio of the image
    width_ratio; //the zoom ratio of the image based on width
    height_ratio; //the zoom ratio of the image based on height
    max_zoom = 4.0; //the maximum zoom level
    fit_zoom; //fit zoom level
    zoom; //zoom level

    min_dimension = 64; //minimum dimension of the image, for cropping and what's permitted
    max_dimension = 1920; //maximum dimension of the image, which will resize if too big
    mode; //the mouse action mode
    rotate_angle = 90; //angle of rotation
    rotating; //if the image is being rotated (to signal to img load event handler)

    message_callback; //callback for external message function

    image_types = ['image/jpeg','image/png','image/webp','image/gif','image/bmp']; //acceptable mimetypes for images

    //mouse stuff
    start_x; //x coordinates when first clicked
    start_y; //y coordinates when first clicked
    mouse_engaged = false; //is the mouse down

    //cropping stuff
    crop = {x:null, y:null, width:null, height:null, start_x:null, start_y:null}; //info on the crop
    crop_state; //the which cropping editing method to be used
    handle_radius = 4; //radius of the crop handles
    current_image = {
        x:null, y:null,
        width:null, height:null,
        start_x:null, start_y:null
    }; //presented on canvas image info

    constructor(canvas, message_callback){
        //possible max width 2056
        console.log('ImageEditor constructor!');

        this.canvas = canvas;
        console.log(canvas);
        this.ctx = this.canvas.getContext('2d');
        this.img = new Image();
        this.img.crossOrigin = 'Anonymous';

        this.message_callback = message_callback;
        this.mode = 'move';
        this.rotating = false;

        //mouse actions on canvas
        this.canvas.addEventListener('mousedown touchstart',this.mouse_down.bind(this));
        window.addEventListener('mouseup touchend',this.mouse_up.bind(this));
        this.canvas.addEventListener('mousemove touchmove',this.mouse_move.bind(this));

        //zoom buttons
        this.zoom = 1.0;

        window.addEventListener('resize', ()=>{ //redraw on window resize, such as opening and closing the dev console
            console.log('resize');
            if (this.canvas.offsetParent !== null && this.img.src){
                this.canvas.removeAttribute('width');
                this.canvas.removeAttribute('height');
                this.load_image(null, true);
            }
        });
        this.img.addEventListener('load', this.load_image.bind(this)); //important to run when image is done loading, otherwise no dimensions
        console.log(this.canvas.width, this.canvas.height);
    }
    set_img_src(src){
        this.img.src = src;
    }
    load_image(e, keep_crop=false){
        console.log('load_image', e);
        console.log(devicePixelRatio);
        if (this.rotating){ //if rotating keep crop and zoom level
            keep_crop = true;
            this.rotating = false;
        }

        try{
            this.mime_type = this.img.src.substring(this.img.src.indexOf(':')+1, this.img.src.indexOf(';'));
            console.log('mime_type', this.mime_type);

            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;

            let cwidth = this.canvas.width;
            let cheight = this.canvas.height;

            let iwidth = this.img.width;
            let iheight = this.img.height;

            let is_wide = iwidth > iheight;
            console.log('is_wide', is_wide, iwidth, iheight);
            if (iwidth < this.min_dimension || iheight < this.min_dimension){ //minimum size check
                throw new Error("Image doesn't meet minimum size");
            }

            //get adjusted ratio to keep image within max
            if (iwidth > this.max_dimension && is_wide){
                console.log('reduce width');
                this.adjusted_ratio = this.max_dimension / iwidth;
            }else if (iheight > this.max_dimension){
                console.log('reduce height');
                this.adjusted_ratio = this.max_dimension  / iheight;
            }else{
                this.adjusted_ratio = 1.0;
            }
            console.log('keep_crop', keep_crop);
            if (!keep_crop){
                this.crop = {
                    x:0, y:0,
                    width:iwidth, height:iheight,
                    start_x:null, start_y:null
                };
            }

            this.width_ratio = (iwidth * this.adjusted_ratio) / cwidth;
            this.height_ratio = (iheight * this.adjusted_ratio) / cheight;

            console.log('cwidth', cwidth, 'cheight', cheight, 'adjusted_ratio', this.adjusted_ratio,
            'width_ratio', this.width_ratio, 'height_ratio', this.height_ratio,
            'iwidth/width_ratio', iwidth/this.width_ratio, 'iheight/width_ratio',iheight/this.width_ratio,
            'iwidth/height_ratio', iwidth/this.height_ratio, 'iheight/height_ratio', iheight/this.height_ratio);
            //fill height or fill width
            if (iwidth * this.adjusted_ratio > cwidth || iheight * this.adjusted_ratio > cheight){ //try to fit into canvas
                if (iwidth*this.adjusted_ratio/this.height_ratio > cwidth){//fit wide because the height is larger than the canvas
                    this.ratio = this.width_ratio;
                }else{//fit high
                    this.ratio = this.height_ratio;
                }
                this.fit_zoom = this.adjusted_ratio/this.ratio;
            }else{
                this.fit_zoom = this.adjusted_ratio;
                this.ratio = this.width_ratio;
            }
            //check for zoom levels, based on keep crop or not
            if (!keep_crop){
                this.zoom = this.fit_zoom;
            }else{
                this.zoom = Math.max(this.fit_zoom, this.zoom);
            }
            console.log('ratio', this.ratio);
            console.log('zoom', this.zoom);
            console.log('crop', this.crop);

            let current = this.current_image;
            current.width = iwidth * this.zoom;
            current.height = iheight * this.zoom;

            current.x = (cwidth - current.width)/2;
            current.y = (cheight - current.height)/2;

            console.log('current', current);
            this.set_mode(this.mode);
        }catch(ex){
            this.message_callback(ex.message);
        }

    }
    //Draw the scale image on the canvas
    draw_image(){
        console.log('draw_image');
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); //clear image

        let src = {x:0,y:0, width:this.img.width, height:this.img.height};
        let current = this.current_image;
        console.log('src.x', src.x, 'src.y', src.y, 'src.width', src.width, 'src.height', src.height, //get all of source images
        'current.x', current.x, 'current.y', current.y, 'current.width', current.width, 'current.height', current.height);

        //draw whole image at lower opacity
        this.ctx.globalAlpha = 0.5;
        this.ctx.drawImage(this.img,
            src.x, src.y, src.width, src.height, //get all of source images
            current.x, current.y,
            current.width, current.height);
        //then draw cropped area at full opacity
        this.ctx.globalAlpha = 1;
        src = (({x,y,width,height})=>({x,y,width,height}))(this.crop);
        console.log('src.x', src.x, 'src.y', src.y, 'src.width', src.width, 'src.height', src.height);
        this.ctx.drawImage(this.img,
            src.x, src.y, src.width, src.height, //get all of source images
            this.current_image.x+this.crop.x*this.zoom,
            this.current_image.y+this.crop.y*this.zoom,
            this.crop.width*this.zoom,
            this.crop.height*this.zoom);
    }

    draw_cropper(){
        let ctx = this.ctx;
        let cropbox = this.cropbox;
        console.log(cropbox);

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#0095DA88';
        ctx.fillStyle = '#0095DA88';

        //main rectangle
        ctx.beginPath();
        ctx.rect(cropbox.x, cropbox.y, cropbox.width, cropbox.height);
        let width3rd = cropbox.width*.33;
        ctx.moveTo(cropbox.x + width3rd, cropbox.y);
        ctx.lineTo(cropbox.x + width3rd, cropbox.y+cropbox.height);
        ctx.moveTo(cropbox.x + width3rd*2, cropbox.y);
        ctx.lineTo(cropbox.x + width3rd*2, cropbox.y+cropbox.height);
        let height3rd = cropbox.height*.33;
        ctx.moveTo(cropbox.x, cropbox.y + height3rd);
        ctx.lineTo(cropbox.x + cropbox.width, cropbox.y + height3rd);
        ctx.moveTo(cropbox.x, cropbox.y + height3rd*2);
        ctx.lineTo(cropbox.x + cropbox.width, cropbox.y + height3rd*2);
        ctx.stroke();
        ctx.closePath();

        //corner circles
        let positions = [{x:cropbox.x, y:cropbox.y},{x:cropbox.x+cropbox.width, y:cropbox.y},
            {x:cropbox.x, y:cropbox.y+cropbox.height},{x:cropbox.x+cropbox.width, y:cropbox.y+cropbox.height}];
        positions.forEach(p=>{
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.handle_radius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        });
    }
    set_mode(mode){
        console.log('set_mode', mode);
        this.mode = mode;

        if(mode==='move'){
            this.set_view_mode();
        }else if (mode==='crop'){
            this.set_crop_mode();
        }
    }
    set_view_mode(){
        this.canvas.style.cursor = 'move';
        this.draw_image();
    }
    set_crop_mode(){
        this.canvas.style.cursor = 'default';
        this.draw_image();
        this.draw_cropper();
    }
    mouse_down(e){
        this.mouse_engaged  = true;
        if (e.touches){ //touch
            let canvasbox = this.canvas.getBoundingClientRect();
            this.start_x = e.touches[0].clientX - canvasbox.left;
            this.start_y = e.touches[0].clientY - canvasbox.top;
        }else{ //mouse
            this.start_x = e.offsetX;
            this.start_y = e.offsetY;
        }

        if (this.mode==='move'){
            console.log(this.current);
            this.current_image.start_x = this.current_image.x;
            this.current_image.start_y = this.current_image.y;
        }else if (this.mode==='crop'){
            this.crop.start_x = this.cropbox.x;
            this.crop.start_y = this.cropbox.y;
            if (this.crop_state==='default'){
                this.current_image.start_x = this.current_image.x;
                this.current_image.start_y = this.current_image.y;
            }
            console.log(this.crop);
        }
    }
    mouse_up(){
        this.mouse_engaged = false;
    }
    mouse_move(e){
        let current_x, current_y;
        if (e.touches){ //touch
            let canvasbox = this.canvas.getBoundingClientRect();
            current_x = e.touches[0].clientX - canvasbox.left;
            current_y = e.touches[0].clientY - canvasbox.top;
        }else{ //mouse
            current_x = e.offsetX;
            current_y = e.offsetY;
        }

        let change_x = current_x - this.start_x;
        let change_y = current_y - this.start_y;
        let current = this.current_image;
        if (this.mouse_engaged){
            console.log(change_x, change_y);

            if(this.mode==='move'){ //move image
                //bounds check
                let x_pos = current.start_x+change_x;
                let y_pos = current.start_y+change_y;

                current.x = this.check_x_bounds(x_pos);
                current.y = this.check_y_bounds(y_pos);
                this.draw_image();
            }else if (this.mode==='crop'){
                let x_pos = this.cropbox.x, y_pos = this.cropbox.y;
                let crop_width = this.cropbox.width;
                let crop_height = this.cropbox.height;
                console.log(this.cropbox);
                let cropright = this.cropbox.x+this.cropbox.width;
                let cropbottom = this.cropbox.y+this.cropbox.height;

                let left_resize = ()=>{
                    if (current_x < current.x) x_pos=current.x; //don't grow beyond left edge
                    else if (current_x > cropright - this.min_dimension/this.ratio) x_pos=cropright-this.min_dimension/this.ratio; //don't shrink smaller than minimum
                    else x_pos = current_x;

                    crop_width = cropright - x_pos;
                };
                let right_resize = ()=>{
                    if (current_x < current.x+current.width  //don't grow beyond the right edge
                    && current_x > this.cropbox.x + this.min_dimension/this.ratio) //don't shrink smaller than the minimum
                        crop_width = current_x - this.cropbox.x;
                };
                let top_resize = ()=>{
                    if (current_y < current.y) y_pos=current.y; //don't grow beyond the top edge
                    else if (current_y > cropbottom - this.min_dimension/this.ratio) y_pos=cropbottom-this.minheight/this.ratio; //don't shrink smaller than minimum
                    else y_pos = current_y;

                    crop_height = cropbottom - y_pos;
                }
                let bottom_resize = ()=>{
                    if (current_y < current.y+current.height //don't grow beyond the bottom edge
                    && current_y > this.cropbox.y + this.min_dimension/this.ratio) //don't shrink smaller than the minimum
                        crop_height = current_y - this.cropbox.y;
                }
                switch(this.crop_state){
                    case 'nw-resize':
                        top_resize();
                        left_resize();
                        break;
                    case 'ne-resize':
                        top_resize();
                        right_resize();
                        break;
                    case 'sw-resize':
                        bottom_resize();
                        left_resize();
                        break;
                    case 'se-resize':
                        bottom_resize();
                        right_resize();
                        break;
                    case 'w-resize':
                        left_resize();
                        break;
                    case 'e-resize':
                        right_resize();
                        break;
                    case 'n-resize':
                        top_resize();
                        break;
                    case 's-resize':
                        bottom_resize();
                        break;
                    case 'move':
                        x_pos = this.crop.start_x+change_x;
                        y_pos = this.crop.start_y+change_y;

                        if (x_pos < current.x){ //leftside
                            x_pos = current.x;
                        }else if (x_pos + crop_width > current.x + current.width){//rightside
                            x_pos = current.x + current.width - crop_width;
                        }
                        if (y_pos < current.y){ //topside
                            y_pos = current.y;
                        }else if (y_pos + crop_height > current.y + current.height){//bottomside
                            y_pos = current.y + current.height - crop_height;
                        }
                        break;
                    default:

                        current.x = this.check_x_bounds(current.start_x+change_x);
                        current.y = this.check_y_bounds(current.start_y+change_y);
                        x_pos = current.x + this.crop.x*this.zoom;
                        y_pos = current.y + this.crop.y*this.zoom;
                }

                this.crop.x = (x_pos - current.x)/this.zoom;
                this.crop.y = (y_pos - current.y)/this.zoom;
                this.crop.width = crop_width/this.zoom;
                this.crop.height = crop_height/this.zoom;
                console.log(this.crop);
                this.draw_image();
                this.draw_cropper();
            }
        }else{
            let cropbox = this.cropbox;
            let rightedge = cropbox.x + cropbox.width;
            let bottomedge = cropbox.y + cropbox.height;
            if (this.mode==='crop'){
                if (current_x >= cropbox.x-this.handle_radius && current_x <= cropbox.x+this.handle_radius &&
                current_y >= cropbox.y-this.handle_radius && current_y <= cropbox.y+this.handle_radius){ //upper left
                    this.crop_state = 'nw-resize';
                }else if (current_x >= rightedge-this.handle_radius && current_x <= rightedge+this.handle_radius &&
                current_y >= cropbox.y-this.handle_radius && current_y <= cropbox.y+this.handle_radius){ //upper right
                    this.crop_state = 'ne-resize';
                }else if (current_x >= cropbox.x-this.handle_radius && current_x <= cropbox.x+this.handle_radius &&
                current_y >= bottomedge-this.handle_radius && current_y <= bottomedge+this.handle_radius){ //lower left
                    this.crop_state = 'sw-resize';
                }else if (current_x >= rightedge-this.handle_radius && current_x <= rightedge+this.handle_radius &&
                current_y >= bottomedge-this.handle_radius && current_y <= bottomedge+this.handle_radius){ //lower right
                    this.crop_state = 'se-resize';
                }else if (current_x >= cropbox.x-this.handle_radius && current_x <= cropbox.x+this.handle_radius &&
                current_y > cropbox.y+this.handle_radius && current_y < bottomedge-this.handle_radius){ //left edge
                    this.crop_state = 'w-resize';
                }else if (current_x >= rightedge-this.handle_radius && current_x <= rightedge+this.handle_radius &&
                current_y > cropbox.y+this.handle_radius && current_y < bottomedge-this.handle_radius){ //right edge
                    this.crop_state = 'e-resize';
                }else if (current_y >= cropbox.y-this.handle_radius && current_y <= cropbox.y+this.handle_radius &&
                current_x > cropbox.x+this.handle_radius && current_x < rightedge-this.handle_radius){ //top edge
                    this.crop_state = 'n-resize';
                }else if (current_y >= bottomedge-this.handle_radius && current_y <= bottomedge+this.handle_radius &&
                current_x > cropbox.x+this.handle_radius && current_x < rightedge-this.handle_radius){ //top edge
                    this.crop_state = 's-resize';
                }else if (current_x > cropbox.x+this.handle_radius && current_x < rightedge-this.handle_radius &&
                current_y > cropbox.y+this.handle_radius && current_y < bottomedge-this.handle_radius){ //inside
                    this.crop_state = 'move';
                } else{ //outside
                    this.crop_state = 'default';
                }
                this.canvas.style.cursor = this.crop_state;

            }
        }
    }
    check_x_bounds(x_pos){
        let current = this.current_image;
        if (current.width <= this.canvas.width){ //image is smaller than canvas
            if (x_pos < 0){ //leftside
                x_pos = 0;
            }else if (x_pos + current.width > this.canvas.width){//rightside
                x_pos = this.canvas.width - current.width;
            }
        }else{ //image is larger than canvas
            if (x_pos + current.width < this.canvas.width){
                x_pos = this.canvas.width - current.width; //leftside
            }else if (x_pos > 0){
                x_pos = 0; //rightside
            }
        }
        return x_pos;
    }
    check_y_bounds(y_pos){
        let current = this.current_image;
        if (current.height <= this.canvas.height){ //image is smaller than canvas
            if (y_pos < 0){ //topside
                y_pos = 0;
            }else if (y_pos + current.height > this.canvas.height){//bottomside
                y_pos = this.canvas.height - current.height;
            }
        }else{ //image is larger than canvas
            if (y_pos + current.height < this.canvas.height){
                y_pos = this.canvas.height - current.height; //topside
            }else if (y_pos > 0){
                y_pos = 0; //bottomside
            }
        }
        return y_pos;
    }
    zoom_in(){
        this.scale(2.0);
    }
    zoom_out(){
        this.scale(.5);
    }
    scale(scale){
        let current = this.current_image;
        let center_x = this.canvas.width / 2;
        let center_y = this.canvas.height / 2;

        let is_wide = this.img.width > this.img.height;
        console.log('is_wide',is_wide);
        let new_zoom = this.zoom * scale;
        if (scale<1.0 && new_zoom < this.fit_zoom){
            console.log('zoom out too small');
            new_zoom = this.fit_zoom;
        }
        new_zoom = Math.min(this.max_zoom, new_zoom);
        console.log('new_zoom',new_zoom);
        scale = new_zoom / this.zoom;
        console.log('scale',scale);

        let x_diff = current.x - center_x;
        let y_diff = current.y - center_y;

        //adjust width
        current.width = current.width * scale;
        current.height = current.height * scale;

        //adjust x and y which gets shifted
        let x_pos = center_x + x_diff * scale;
        let y_pos = center_y + y_diff * scale;


        current.x = this.check_x_bounds(x_pos);
        current.y = this.check_y_bounds(y_pos);
        console.log(scale, x_diff, y_diff, current.x, current.y);
        this.ratio = this.width_ratio = this.img.width / current.width;
        this.height_ratio = this.img.height / current.height;

        this.zoom = new_zoom;

        console.log('zoom', this.zoom);
        this.draw_image();
        if (this.mode==='crop'){
            this.draw_cropper();
        }
    }
    rotate_image(deg){
        let img = this.img;
        let angle = deg*Math.PI/180;
        console.log('angle',angle);

        let ncanvas = document.createElement('canvas'); //temporary canvas to overwrite canvas
        ncanvas.width = img.height;
        ncanvas.height = img.width;

        console.log(ncanvas.width, ncanvas.height);

        //rotate crop area
        if (deg === 90){
            [this.crop.x, this.crop.y] = [this.img.height-this.crop.y-this.crop.height, this.crop.x];
        }else if (deg === -90){
            [this.crop.x, this.crop.y] = [this.crop.y, this.img.width-this.crop.x-this.crop.width];
        }
        [this.crop.width, this.crop.height] = [this.crop.height, this.crop.width];
        console.log('new crop', this.crop);

        let ctx = ncanvas.getContext('2d');

        //rotating from center
        ctx.translate(ncanvas.width/2, ncanvas.height/2);
        ctx.rotate(angle);
        ctx.translate(-ncanvas.width/2, -ncanvas.height/2);
        ctx.drawImage(img, 0,0,
            img.width,img.height,
            (ncanvas.width-img.width)/2, -(ncanvas.width-img.width)/2,
            img.width, img.height);
        console.log((ncanvas.width-img.width)/2, -(ncanvas.width-img.width)/2,
        img.width, img.height);
        let img_url = ncanvas.toDataURL(this.mime_type);
        this.rotating = true; //to keep crop
        this.img.src = img_url; //set new image data
    }

    save_image(){
        //create new canvas
        let ncanvas = document.createElement('canvas');
        let crop = this.crop;
        ncanvas.width = crop.width * this.adjusted_ratio;
        ncanvas.height = crop.height * this.adjusted_ratio;
        let ctx = ncanvas.getContext('2d');
        ctx.drawImage(this.img, crop.x, crop.y, crop.width, crop.height,
            0, 0, ncanvas.width, ncanvas.height);
        console.log('save as', this.mime_type);
        let img_url = ncanvas.toDataURL(this.mime_type);
        return img_url;
    }

    invalid_file(){
        this.message_callback('Only JPEGs, PNGs, GIFs, BMPs, or WebP allowed');
    }

    get cropbox(){
        let current = this.current_image;
        return {
            x: current.x + this.crop.x*this.zoom,
            y: current.y + this.crop.y*this.zoom,
            width: this.crop.width*this.zoom,
            height: this.crop.height*this.zoom
        };
    }
}
