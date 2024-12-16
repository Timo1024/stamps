import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setIsVisible(true);
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
      <div className="stamp-modal">
        <button className="close-button" onClick={handleClose}>X</button>
        <div className="stamp-modal-content">
          <h2>{stamp.set_name}</h2>
          <img src={`http://localhost:5000/images/${stamp.image_path}`} alt={stamp.set_name} />
          <div className="stamp-details">
            <p><strong>Country:</strong> {stamp.country}</p>
            <p><strong>Year:</strong> {stamp.year}</p>
            <p><strong>Denomination:</strong> {stamp.denomination}</p>
            <p><strong>Themes:</strong> {stamp.themes}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
            />
            <input type="file" onChange={handleImageChange} />
          </div>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default StampModal;
