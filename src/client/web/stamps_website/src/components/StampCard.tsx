// StampCard.tsx
import React from 'react';

interface StampCardProps {
  country: string;
  name: string;
  imageLink: string | null;
  colorPalette: string | null;
}

const StampCard: React.FC<StampCardProps> = ({ country, name, imageLink, colorPalette }) => {
  const getColors = () => {
    if (!colorPalette) return [];
    try {
      return eval(colorPalette) as string[];
    } catch {
      return [];
    }
  };

  const colors = getColors();

  return (
    <div className="stamp-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {colors.length > 0 && (
        <div className="color-palette" style={{ 
          display: 'flex',
          flexDirection: 'row',
          position: 'absolute',
          bottom: '7px',
          left: '7px',
          zIndex: 1,
          height: '12px',
          overflow: 'hidden'
        }}>
          {colors.map((color, index) => (
            <div
              key={index}
              style={{
                height: '100%',
                width: '12px',
                backgroundColor: color,
                borderRadius: index === 0 ? '3px 0 0 3px' : index === colors.length - 1 ? '0 3px 3px 0' : '0'
              }}
              title={color}
            />
          ))}
        </div>
      )}
      <div className="stamp-image-container">
        <img 
          src={imageLink ? `http://localhost:5000/images/${imageLink}` : '/assets/images/stamp_placeholder_2.jpg'} 
          alt={`${name}`} 
          className="stamp-image"
        />
      </div>
      <div className="stamp-info" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#ffffff',
          marginTop: '1rem',
        }}>{country}</div>
        <div style={{
          fontSize: '0.9rem',
          color: '#cccccc',
          marginTop: '1rem',
          marginBottom: '1rem',
        }}>{name}</div>
      </div>
    </div>
  );
};

export default StampCard;
