# Image Editor <br>
This was originally a project I did on my own time, new the canvas element was a new thing, and then it was adapted into a work project many years later with some new features added. <br>

This was a pure javascript class, but the class also dealt with eventlisteners for controls too. Now the class strictly handles only the canvas manipulation, and the constructor needs both canvas element and a external messaging function. While the controls are now in a React.js component. <br>

## Additions and Removals <br>
One of the addtions were the Rotation buttons. It was adpated to format added images into some more specific dimensions and then integrated with a server backend and retrieving data from S3, it also had the option to edit an existing image, those features has been removed from this demo. <br>

An addition for this project is that it edited images are added to the "Images" gallery section below with thumbnails, they can be previewed at full size, and can be removed from the gallery. <br>

There used to be more restrictive modes, now it's changed such that you can zoom and rotate regardless of the mode it's in. The crop area rotates with the image. <br>

## Modes <br>
"Move" and "Crop" affect mouse options. "Move" clicking and dragging moves the image around. "Crop" adjusts the crop area which can be manipulated from the edges and corners of the box. <br>

## Zoom <br>
It can zoom in and zoom out, there's been limits added in place to how far out one can zoom out which is the original size or the size of the canvas. And the max zoom in is x4 zoom. <br>

## Rotate <br>
It rotates from the center of the image by 90 degrees. <br>

## On images selected for edit <br>
The edited image also has a max size, if the largest dimension is greater than 1920 pixels that dimension is scaled down to 1920 pixels. The editor doesn't accept images with less than 64 pixels for editing. The editor can accept JPGs, PNGs, GIFs, BMPs and WebP images, though GIFs get become PNGs after being edited. <br>