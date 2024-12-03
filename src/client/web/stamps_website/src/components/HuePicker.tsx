import React, { useEffect, useRef, useState } from 'react';

interface HuePickerProps {
  value: number;
  saturation: number;
  onChange: (hue: number, saturation: number) => void;
}

const HuePicker: React.FC<HuePickerProps> = ({ value, saturation, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelImageRef = useRef<ImageData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const size = 200; // Size of the color wheel
  const radius = size / 2;

  // Function to get color from position
  const getColorFromPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + radius;
    const centerY = rect.top + radius;

    // Calculate relative position from center
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Calculate distance from center (for saturation)
    const distance = Math.sqrt(dx * dx + dy * dy);
    const newSaturation = Math.min(distance / radius * 100, 100);

    // Calculate angle (for hue)
    let hue = Math.atan2(dy, dx) * (180 / Math.PI) + 180;

    if (distance <= radius) {
      onChange(hue, newSaturation);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    getColorFromPosition(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      requestAnimationFrame(() => {
        getColorFromPosition(e.clientX, e.clientY);
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add mouse up listener to window to handle dragging outside canvas
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Draw static color wheel once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create temporary canvas for the wheel
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Create circular clip path
    tempCtx.beginPath();
    tempCtx.arc(radius, radius, radius, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();

    // Draw color wheel
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        // Calculate distance from center
        const dx = x - radius;
        const dy = y - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only draw within the circle with a small fade at the edge
        if (distance <= radius) {
          // Calculate hue based on angle
          let hue = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
          
          // Calculate saturation based on distance from center
          const pixelSaturation = (distance / radius) * 100;
          
          // Add fade at the edge
          const alpha = distance > radius - 1 ? 1 - (distance - (radius - 1)) : 1;
          
          // Draw pixel
          tempCtx.fillStyle = `hsla(${hue}, ${pixelSaturation}%, 50%, ${alpha})`;
          tempCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Store the wheel image for reuse
    wheelImageRef.current = tempCtx.getImageData(0, 0, size, size);
  }, []); // Only run once on mount

  // Draw indicator on top of wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || !wheelImageRef.current) return;

    // Clear and redraw wheel
    ctx.clearRect(0, 0, size, size);
    ctx.putImageData(wheelImageRef.current, 0, 0);

    // Draw selected color indicator at exact position
    const angle = (value - 180) * (Math.PI / 180);
    const indicatorDistance = (saturation / 100) * radius;
    const indicatorX = radius + Math.cos(angle) * indicatorDistance;
    const indicatorY = radius + Math.sin(angle) * indicatorDistance;

    // Draw indicator circle
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = `hsl(${value}, ${saturation}%, 50%)`;
    ctx.fill();
  }, [value, saturation]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          style={{ cursor: 'pointer' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '8px',
          backgroundColor: `hsl(${value}, ${saturation}%, 50%)`,
          border: '2px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} />
        <div style={{ fontSize: '14px', color: '#666' }}>
          HSL({Math.round(value)}, {Math.round(saturation)}%, 50%)
        </div>
      </div>
    </div>
  );
};

export default HuePicker;