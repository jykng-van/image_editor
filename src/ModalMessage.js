import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

export default function Message({isOpen,onClose,children}){
    const messageDialog = useRef(null);

    useEffect(()=>{
      if (isOpen) messageDialog.current.showModal();
    });
    if (!isOpen) return null;
    return createPortal(
      (<dialog id="message-dialog" ref={messageDialog}>
        <div className='content'>
          <div className="message">{children}</div>
          <button onClick={onClose}>OK</button>
        </div>
      </dialog>), document.body
    );
  }