import React, { useEffect, useRef } from 'react';
import { getColor } from '../physics/color';

const ColorLegend = ({ min = -8, max = -2, width = 20, height = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Draw gradient
    for (let y = 0; y < h; y++) {
      // Map y to value (top is max, bottom is min)
      const t = 1 - (y / h);
      const val = min + t * (max - min);
      
      const color = getColor(val, min, max);
      ctx.fillStyle = color;
      ctx.fillRect(0, y, w, 1);
    }
  }, [min, max]);

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

