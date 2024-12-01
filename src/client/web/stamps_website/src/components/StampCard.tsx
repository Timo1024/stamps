// StampCard.tsx
import React from 'react';

interface StampCardProps {
  country: string;
  name: string;
  imageLink: string | null;
}

const StampCard: React.FC<StampCardProps> = ({ country, name, imageLink }) => {
  return (
    <div className="stamp-card">
      <div className="stamp-image-container">
        <img 
        src={imageLink ? `http://localhost:5000/images/${imageLink}` : '/assets/images/stamp_placeholder_2.jpg'} 
        alt={`${name}`} 
        className="stamp-image"
        />
      </div>
      <div className="stamp-info">
        <h3>{country}</h3>
        <p>{name}</p>
      </div>
    </div>
  );
};

export default StampCard;
