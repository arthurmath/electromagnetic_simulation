import React, { useEffect, useRef } from 'react';
import { getColor, getPotentialColor } from '../physics/color';

const ColorLegend = ({ min = -8, max = -2, width = 20, height = 200, mode = 'magnitude' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    if (mode === 'magnitude') {
      // Draw gradient for magnitude
      for (let y = 0; y < h; y++) {
        // Map y to value (top is max, bottom is min)
        const t = 1 - (y / h);
        const val = min + t * (max - min);
        
        const color = getColor(val, min, max);
        ctx.fillStyle = color;
        ctx.fillRect(0, y, w, 1);
      }
    } else if (mode === 'potential') {
      // Draw diverging gradient for potential
      // Top half: Positive values (Red -> White)
      // Bottom half: Negative values (White -> Blue)
      // We use min and max as log magnitude bounds (e.g. -9 to -4)
      
      const halfH = h / 2;
      
      // Top half (Positive)
      // y=0 -> 10^max (Red)
      // y=halfH -> 10^min (White)
      for (let y = 0; y < halfH; y++) {
        const t = 1 - (y / halfH); // 1 at top, 0 at middle
        // log magnitude from min to max
        const logMag = min + t * (max - min);
        const val = Math.pow(10, logMag);
        
        const color = getPotentialColor(val, min, max);
        ctx.fillStyle = color;
        ctx.fillRect(0, y, w, 1);
      }
      
      // Bottom half (Negative)
      // y=halfH -> -10^min (White)
      // y=h -> -10^max (Blue)
      for (let y = halfH; y < h; y++) {
        const t = (y - halfH) / (h - halfH); // 0 at middle, 1 at bottom
        const logMag = min + t * (max - min);
        const val = -Math.pow(10, logMag);
        
        const color = getPotentialColor(val, min, max);
        ctx.fillStyle = color;
        ctx.fillRect(0, y, w, 1);
      }
    }
  }, [min, max, mode]);

  if (mode === 'potential') {
    // Labels need better positioning or just Top/Bottom/Middle
    // The current flex layout might not be ideal for 4 labels with canvas in middle
    // Let's overlay labels or just use Top/Bottom and maybe Middle
    return (
      <div style={styles.container}>
        <div style={styles.label}>+10<sup>{max}</sup></div>
        <canvas 
          ref={canvasRef} 
          width={width} 
          height={height} 
          style={styles.canvas}
        />
        <div style={styles.label}>-10<sup>{max}</sup></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.label}>10<sup>{max}</sup> T</div>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={styles.canvas}
      />
      <div style={styles.label}>10<sup>{min}</sup> T</div>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    right: '20px',
    top: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '10px',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    zIndex: 10
  },
  canvas: {
    border: '1px solid #ccc'
  },
  label: {
    fontSize: '12px',
    fontFamily: 'monospace'
  }
};

export default ColorLegend;

