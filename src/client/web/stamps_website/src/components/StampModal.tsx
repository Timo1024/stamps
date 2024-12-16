import React, { useState, useEffect, useRef } from 'react';
import './StampModal.css';

interface StampModalProps {
  stamp: any;
  onClose: () => void;
  onSave: (updatedStamp: any) => void;
}

const StampModal: React.FC<StampModalProps> = ({ stamp, onClose, onSave }) => {
  const [note, setNote] = useState(stamp.note || '');
  const [image, setImage] = useState<File | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);
    
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    const updatedStamp = { ...stamp, note };
    onSave(updatedStamp);
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Match the duration of the CSS transition
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className={`stamp-modal-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="stamp-modal" ref={modalRef}>
        <button className="close-button" onClick={handleClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M0.646447 0.646447C0.841709 0.451184 1.15829 0.451184 1.35355 0.646447L4 3.29289L6.64645 0.646447C6.84171 0.451184 7.15829 0.451184 7.35355 0.646447C7.54882 0.841709 7.54882 1.15829 7.35355 1.35355L4.70711 4L7.35355 6.64645C7.54882 6.84171 7.54882 7.15829 7.35355 7.35355C7.15829 7.54882 6.84171 7.54882 6.64645 7.35355L4 4.70711L1.35355 7.35355C1.15829 7.54882 0.841709 7.54882 0.646447 7.35355C0.451184 7.15829 0.451184 6.84171 0.646447 6.64645L3.29289 4L0.646447 1.35355C0.451184 1.15829 0.451184 0.841709 0.646447 0.646447Z" fill="#fff"/>
          </svg>
        </button>
        <div className="stamp-modal-content">
          <h2>{stamp.set_name}</h2>
          <img src={`http://localhost:5000/images/${stamp.image_path.replace('./images_all_2/', '')}`} alt={stamp.set_name} />
          <div className="stamp-details">
            <p><strong>Country:</strong> {stamp.country}</p>
            <p><strong>Year:</strong> {stamp.year}</p>
            <p><strong>Denomination:</strong> {stamp.denomination}</p>
            <p><strong>Themes:</strong> {stamp.themes}</p>
            {/* <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
            /> */}
            {/* <input type="file" onChange={handleImageChange} /> */}
          </div>
          {/* <button onClick={handleSave}>Save</button> */}
        </div>
      </div>
    </div>
  );
};

export default StampModal;
