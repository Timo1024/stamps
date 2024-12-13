// StampCard.tsx
import React, { useState, useEffect } from 'react';
import './StampCard.css';

interface StampCardProps {
  country: string;
  name: string;
  imageLink: string | null;
  colorPalette: string | null;
  denomination: number | null;
  year: number;
  themes: string | null;
}

const StampCard: React.FC<StampCardProps> = ({
  country,
  name,
  imageLink,
  colorPalette,
  denomination,
  year,
  themes,
}) => {
  const [colors, setColors] = useState<string[]>([]);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [themeList, setThemeList] = useState<string[]>([]);

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

  useEffect(() => {
    if (themes) {
      try {
        const parsedThemes = JSON.parse(themes.replace(/'/g, '"'));
        console.log(parsedThemes);
        
        // split each element at / at just kee unique values
        const uniqueThemes : Set<string> = new Set(parsedThemes.flatMap((theme: string) => theme.split('/')));
        // set to array
        const uniqueThemesArray : string[] = Array.from(uniqueThemes);
        
        console.log(uniqueThemesArray);
        
        setThemeList(uniqueThemesArray);
      } catch (error) {
        console.error('Error parsing themes:', error);
      }
    }
  }, [themes]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`stamp-${name}-${country}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [name, country]);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  return (
    <div id={`stamp-${name}-${country}`} className="stamp-card">
      <div className="stamp-image-container">
        {isInView && imageLink && (
          <>
            <div className={`image-placeholder ${isImageLoaded ? 'hidden' : ''}`}>
              Loading...
            </div>
            <img
              src={`http://localhost:5000/images/${imageLink}`}
              alt={`${country} - ${name}`}
              className={`stamp-image ${isImageLoaded ? 'loaded' : ''}`}
              onLoad={handleImageLoad}
            />
          </>
        )}
        {!imageLink && (
          <div className="no-image">No image available</div>
        )}
      </div>
      <div className="stamp-info">
        <div className="stamp-country">{country}</div>
        <div className="stamp-name">{name}</div>
        <div className='stamp-detail-wrapper-two'>
          <div className="stamp-detail-wrapper">
            <div className="stamp-detail-label">Denomination:</div>
            <div className="stamp-denomination">{denomination}</div>
          </div>
          <div className='stamp-detail-wrapper'>
            <div className="stamp-detail-label">Year:</div>
            <div className="stamp-year">{year}</div>
          </div>
        </div>
        <div className="stamp-themes-wrapper-long">
          <div className="stamp-detail-label">Themes:</div>
          {themeList.length > 0 && (
            <div className="stamp-themes">
              {themeList.join(', ')}
            </div>
          )}
          {themeList.length === 0 && (
            <div className="stamp-themes">-</div>
          )}
        </div>
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
