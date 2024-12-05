import React, { useEffect, useRef, useState } from 'react';

interface HuePickerProps {
  value: number;
  saturation: number;
  onChange: (hue: number, saturation: number) => void;
  baseTolerance: number;
  onToleranceChange: (tolerance: number) => void;
}

const HuePicker: React.FC<HuePickerProps> = ({
  value,
  saturation,
  onChange,
  baseTolerance,
  onToleranceChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelImageRef = useRef<ImageData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const size = 200; // Size of the color wheel
  const radius = size / 2;
  const deadZoneRadius = radius * 0.15; // 15% of the radius will be the "dead zone"

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
    
    // Don't allow selection in the dead zone
    if (distance <= deadZoneRadius) {
      return;
    }

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

  // Initialize color wheel
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isOpen) {
      // Clear the canvas when closed
      ctx.clearRect(0, 0, size, size);
      wheelImageRef.current = null;
      return;
    }

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create temporary canvas for better anti-aliasing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Clear both canvases first
    ctx.clearRect(0, 0, size, size);
    tempCtx.clearRect(0, 0, size, size);

    // Enable anti-aliasing on temp canvas
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    // Create circular clip path
    tempCtx.beginPath();
    tempCtx.arc(radius, radius, radius, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();

    // Draw color wheel
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const dx = x - radius;
        const dy = y - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only draw within the circle with a smooth fade at both edges
        if (distance <= radius + 1.5) {
          // Calculate base alpha for edge fading
          let alpha = 1;

          // Fade at outer edge
          if (distance > radius - 1.5) {
            alpha = Math.max(0, 1 - (distance - (radius - 1.5)) / 1.5);
          }

          // Skip drawing in the dead zone to let background show through
          if (distance > deadZoneRadius) {
            // Calculate hue based on angle
            let hue = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
            
            // Calculate saturation based on distance from center
            const pixelSaturation = (distance / radius) * 100;

            // Add smooth transition at dead zone border
            const deadZoneTransition = Math.max(0, Math.min(1, (distance - deadZoneRadius) / 1.5));
            
            tempCtx.fillStyle = `hsla(${hue}, ${pixelSaturation}%, 50%, ${alpha * deadZoneTransition})`;
            tempCtx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    // Draw subtle dead zone border with gradient
    const gradient = tempCtx.createRadialGradient(
      radius, radius, deadZoneRadius - 0.75,
      radius, radius, deadZoneRadius + 0.75
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    tempCtx.beginPath();
    tempCtx.arc(radius, radius, deadZoneRadius, 0, Math.PI * 2);
    tempCtx.strokeStyle = gradient;
    tempCtx.lineWidth = 2;
    tempCtx.stroke();

    // Copy to main canvas and store for reuse
    ctx.drawImage(tempCanvas, 0, 0);
    wheelImageRef.current = ctx.getImageData(0, 0, size, size);
  }, [isOpen]);

  // Update selected point
  useEffect(() => {
    if (!canvasRef.current || !wheelImageRef.current || !isOpen) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear and redraw wheel
    ctx.clearRect(0, 0, size, size);
    ctx.putImageData(wheelImageRef.current, 0, 0);

    // Draw selected color indicator at exact position
    const angle = (value - 180) * (Math.PI / 180);
    const indicatorDistance = (saturation / 100) * radius;
    const indicatorX = radius + Math.cos(angle) * indicatorDistance;
    const indicatorY = radius + Math.sin(angle) * indicatorDistance;

    // Only draw indicator if outside dead zone
    if (indicatorDistance > deadZoneRadius) {
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = `hsl(${value}, ${saturation}%, 50%)`;
      ctx.fill();
    }
  }, [value, saturation, isOpen]);

  // Draw tolerance overlay
  useEffect(() => {
    if (!canvasRef.current || !wheelImageRef.current || !isOpen) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear and redraw wheel
    ctx.clearRect(0, 0, size, size);
    ctx.putImageData(wheelImageRef.current, 0, 0);

    // Draw selected color indicator at exact position
    const angle = (value - 180) * (Math.PI / 180);
    const indicatorDistance = (saturation / 100) * radius;
    const indicatorX = radius + Math.cos(angle) * indicatorDistance;
    const indicatorY = radius + Math.sin(angle) * indicatorDistance;

    // Only draw indicator if outside dead zone
    if (indicatorDistance > deadZoneRadius) {
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = `hsl(${value}, ${saturation}%, 50%)`;
      ctx.fill();
    }

    // Calculate delta based on current HSL color
    const calculateDelta = (h: number, s: number): number => {
      // Convert HSL to RGB to calculate delta
      const c = (1 - Math.abs(2 * 0.5 - 1)) * (s / 100);
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = 0.5 - c / 2;
      
      let r, g, b;
      if (h >= 0 && h < 60) { [r, g, b] = [c, x, 0]; }
      else if (h >= 60 && h < 120) { [r, g, b] = [x, c, 0]; }
      else if (h >= 120 && h < 180) { [r, g, b] = [0, c, x]; }
      else if (h >= 180 && h < 240) { [r, g, b] = [0, x, c]; }
      else if (h >= 240 && h < 300) { [r, g, b] = [x, 0, c]; }
      else { [r, g, b] = [c, 0, x]; }
      
      [r, g, b] = [r + m, g + m, b + m];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return max - min;
    };

    // Draw tolerance overlay
    const delta = calculateDelta(value, saturation);
    const adjustedTolerance = baseTolerance * (1 + (1 - delta) * 2);

    // Create temporary canvas for anti-aliasing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    const startAngle = ((value - adjustedTolerance - 180) * Math.PI) / 180;
    const endAngle = ((value + adjustedTolerance - 180) * Math.PI) / 180;
    
    // Calculate radii
    const innerRadius = Math.max(deadZoneRadius, (Math.max(0, saturation - adjustedTolerance) / 100) * radius);
    const outerRadius = Math.min(radius, ((saturation + adjustedTolerance) / 100) * radius);

    // Draw the border lines
    tempCtx.beginPath();
    
    // Draw outer arc
    tempCtx.arc(radius, radius, outerRadius, startAngle, endAngle);
    // Line to inner arc
    tempCtx.lineTo(
      radius + Math.cos(endAngle) * innerRadius,
      radius + Math.sin(endAngle) * innerRadius
    );
    // Draw inner arc
    tempCtx.arc(radius, radius, innerRadius, endAngle, startAngle, true);
    // Close the path
    tempCtx.lineTo(
      radius + Math.cos(startAngle) * outerRadius,
      radius + Math.sin(startAngle) * outerRadius
    );

    // Set border style
    tempCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; 
    tempCtx.lineWidth = 2; 
    
    // Add slight anti-aliasing
    tempCtx.shadowColor = 'rgba(0, 0, 0, 0.3)'; 
    tempCtx.shadowBlur = 0.5;
    
    // Draw the stroke
    tempCtx.stroke();
    
    // Reset shadow
    tempCtx.shadowBlur = 0;

    // Draw to main canvas
    ctx.drawImage(tempCanvas, 0, 0);

    // Add tolerance info text
    // ctx.fillStyle = '#666';
    // ctx.font = '12px Arial';
    // ctx.textAlign = 'center';
    // ctx.fillText(`Tolerance: ±${Math.round(adjustedTolerance)}°`, radius, size - 10);
  }, [value, saturation, baseTolerance, isOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
        <div
          style={{
            width: '100%',
            height: '2rem',
            borderRadius: '4px',
            backgroundColor: `hsl(${value}, ${saturation}%, 50%)`,
            border: `1px solid hsl(${value}, ${saturation}%, 50%)`,
            justifyContent: 'flex-start',
            alignItems: 'center',
            display: 'flex',
            paddingLeft: '10px',
          }}
        >
          <div style={{ color: '#181b1b' }}>Color</div>
        </div>
        <div style={{ 
          transform: `rotate(${isOpen ? '180deg' : '0deg'})`,
          transition: 'transform 0.3s ease',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 18 15" fill="none">
            <path d="M8.16866 13.7564C8.56463 14.3487 9.43537 14.3487 9.83134 13.7564L17.4862 2.30576C17.9304 1.64129 17.4542 0.75 16.6549 0.75H1.34511C0.545834 0.75 0.0695588 1.64129 0.513764 2.30576L8.16866 13.7564Z" fill="white"/>
          </svg>
        </div>
      </div>
      
      <div style={{
        height: isOpen ? '320px' : '0',
        transition: 'height 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
            position: 'absolute',
            top: '10px',
            left: 0,
            right: 0,
            opacity: isOpen ? 1 : 0,
            transform: `translateY(${isOpen ? '0' : '-10px'})`,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            pointerEvents: isOpen ? 'auto' : 'none'
          }}>
            <div style={{ 
              width: size, 
              height: size, 
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              background: '#222626'
            }}>
              <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="color-wheel-canvas"
                style={{
                  width: `${size}px`,
                  height: `${size}px`
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', color: 'white' }}>
                <span>Tolerance: {Math.round(baseTolerance)}°</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="0.1"
                value={baseTolerance}
                onChange={(e) => onToleranceChange(Number(e.target.value))}
                style={{ width: '100%' }}
                className="tolerance-range"
              />
            </div>
          </div>
      </div>
    </div>
  );
};

export default HuePicker;