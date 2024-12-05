// StampCard.tsx
import React, { useState, useEffect } from 'react';

interface StampCardProps {
  country: string;
  name: string;
  imageLink: string | null;
  colorPalette: string | null;
}

const StampCard: React.FC<StampCardProps> = ({ country, name, imageLink, colorPalette }) => {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    if (colorPalette) {
      try {
        // Parse the string representation of the array
        const colorArray = JSON.parse(colorPalette.replace(/'/g, '"'));
        setColors(colorArray);
      } catch (error) {
        console.error('Error parsing color palette:', error);
        setColors([]);
      }
    }
  }, [colorPalette]);

  return (
    <div className="stamp-card">
      <div className="stamp-image-container">
        {imageLink ? (
          <img 
            src={`http://localhost:5000/images/${imageLink}`} 
            alt={`${country} - ${name}`}
            className="stamp-image"
          />
        ) : (
          <div className="no-image">No image available</div>
        )}
      </div>
      <div className="stamp-info">
        <div className="stamp-country">{country}</div>
        <div className="stamp-name">{name}</div>
      </div>
      {colors.length > 0 && (
        <div className="color-palette">
          {colors.map((color, index) => (
            <div
              key={index}
              className="color-box"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StampCard;
