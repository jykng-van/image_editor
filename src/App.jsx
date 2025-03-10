import { useState, useRef, useEffect, useCallback } from 'react';
import ImageEditor from './ImageEditor.js';
import ModalMessage from './ModalMessage.jsx';
import classnames from 'classnames';

function App() {
  //refs
  const canvas = useRef(null);
  const fileInput = useRef(null);
  const editorDialog = useRef(null);
  const cancelButton = useRef(null);
  const editor = useRef();
  const editedPreview = useRef(null);


  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [editorMode, setEditorMode] = useState(null);
  const [editedImages, setEditedImages] = useState([]);
  const [editedImg, setEditedImg] = useState();

  //outside things
  //this.edit_image_button.addEventListener('click', this.initiate_edit_image.bind(this));
  function dragover(e){
    e.preventDefault();
  }
  function drop(e){
    e.preventDefault();
    if (e.dataTransfer.items && e.dataTransfer.items[0].kind === 'file'){
        // Use DataTransferItemList interface to access the file(s)
        let file = e.dataTransfer.items[0].getAsFile();
        console.log(file);


        if (editor.current.image_types.includes(file.type)){
            read_drop_image(file);
        }else{
          editor.current.invalid_file();
        }
    }
  }
  function read_drop_image(file){
    console.log('drop image', file);
    const reader = new FileReader();
    editorDialog.current.showModal();
    reader.addEventListener("load", set_image_data, false);
    reader.readAsDataURL(file);
  }
  function replace_image(e){
    console.log('replace_image', e.target.files);
    const file = e.target.files[0];
    console.log(file);
    if (file && editor.current.image_types.includes(file.type)){
        const reader = new FileReader();
        if (!editorDialog.current.open){
          editorDialog.current.showModal();
        }

        reader.addEventListener("load", set_image_data, false);
        if (file) {
            reader.readAsDataURL(file);
        }
    }else if(file){
      editor.current.invalid_file()
    }else{
      setMessage('No file found');
    }
  }
  // convert image file to base64 string
  function set_image_data(e){
    editor.current.set_img_src(e.target.result);
  }

  //zoom functions
  function zoom_in(){
    editor.current.zoom_in();
  }
  function zoom_out(){
    editor.current.zoom_out();
  }
  //rotate functions
  function rotate(e){
    let deg = editor.current.rotate_angle * e.target.dataset.rotate;
    editor.current.rotate_image(deg);
  }
  //cancel button
  function cancelEditor(){
    //if (this.cancel_button) this.cancel_button.addEventListener('click', this.clear_changes.bind(this));
    editorDialog.current.close();
  }
  //mouse action mode select
  function modeSelect(e){
    editor.current.set_mode(e.target.dataset.mode);
    setEditorMode(editor.current.mode);
  }
  //save edit
  function saveEdit(){
    let data_url = editor.current.save_image();
    //console.log(data_url);
    setEditedImages([...editedImages, data_url]);
    //console.log(editedImages);
    editor.current.set_img_src('');
    editorDialog.current.close();
  }
  //remove image from editedImages
  function removeImage(index){
    setEditedImages(editedImages => editedImages.filter((img, i)=>i!==index));
  }

  //for the modal message
  function openMessage(){
    setIsMessageOpen(true);
  }
  function closeMessage(){
    console.log('close Message!!!!!');
    setIsMessageOpen(false);
  }
  const setMessage = useCallback((text)=>{
    openMessage();
    setMessageText(text);
  },[]);
  //for edited preview
  function showEdited(e){
    e.preventDefault();
    let el = e.target.closest('div');
    console.log(el);
    let index = Array.from(document.querySelectorAll('#images > div')).indexOf(el);
    console.log(index);
    setEditedImg(editedImages[index]);
    console.log(editedImg);
    editedPreview.current.showModal();
  }
  function closeEdited(){
    editedPreview.current.close();
  }



  useEffect(()=>{
    console.log('useEffect', editor);
    if (editor.current == null){
      editor.current = new ImageEditor(canvas.current, setMessage);
      setEditorMode(editor.current.mode);
    }
  },[setMessage, editor]);

  return (
    <>
      <div id="drop-zone" onDragOver={dragover} onDrop={drop}>
        <strong>Drag and Drop Image Here<br />
        or</strong>
        <label htmlFor="image-file">Select Image</label>
      </div>
      <h1>Images</h1>
      <div id="images">
        {editedImages.map((data_url,index)=>(
          <div key={index}>
            <button onClick={()=>removeImage(index)} title="Remove"></button>
            <a href={data_url} onClick={showEdited}><img src={data_url} alt={'image'+index} /></a>
          </div>
        ))}
      </div>
      <dialog id="image-editor" ref={editorDialog}>
        <div className="content">
          <h2>Image Editor</h2>
          <div className="toolbar">
            <div className="actions">
              <button data-mode="move" className={classnames({move:true, current:editorMode==='move'})} onClick={modeSelect} title="Move"></button>
              <button data-mode="crop" className={classnames({crop:true, current:editorMode==='crop'})} onClick={modeSelect} title="Crop"></button>
            </div>
            <div className="zoom">
              <button className="zoom-in" title="Zoom in" onClick={zoom_in}>+</button>
              <button className="zoom-out" title="Zoom out" onClick={zoom_out}>-</button>
            </div>
            <div className="rotate-actions">
              <button data-rotate="-1" className="counter-clockwise" onClick={rotate}>-90&deg;</button>
              <button data-rotate="1" className="clockwise" onClick={rotate}>+90&deg;</button>
            </div>

          </div>
          <canvas id="image-edit-screen" ref={canvas}></canvas>
          <footer className="buttons">
            <button className="save" onClick={saveEdit}>Save</button>
            <button className="cancel" ref={cancelButton} onClick={cancelEditor}>Cancel</button>
            <input type="file" id="image-file" ref={fileInput} accept="image/png, image/jpeg, image/gif, image/bmp, image/webp" onChange={replace_image} />
            <label htmlFor="image-file" className="replace button">Replace Image</label>
          </footer>
        </div>

      </dialog>
      <ModalMessage isOpen={isMessageOpen} onClose={closeMessage} children={messageText}></ModalMessage>
      <dialog id="edited-preview" ref={editedPreview}>
        <div className="content">
          <img src={editedImg} alt="Preview" />
        </div>
        <button onClick={closeEdited}>Close</button>
      </dialog>
    </>
  );
}

export default App;
