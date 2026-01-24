import React, { useEffect, useRef } from 'react';
import { getPotentialColor } from '../physics/color';

const PotentialVisualization = ({ simulation, version, xRange, yRange, resolution, onObjectDrag }) => {
  const canvasRef = useRef(null);
  const dragState = useRef({ isDragging: false, objectId: null, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Compute potential field
    // We use a higher resolution for the heatmap to look good, or interpolate
    // For now, use the provided resolution
    const field = simulation.computePotential(xRange, yRange, resolution);

    // Find max magnitude for normalization (optional, or use fixed scale)
    // Using a fixed log scale often looks better for 1/r fields
    
    const cellWidth = width / resolution;
    const cellHeight = height / resolution;

    // Draw heatmap
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        // field[i][j] contains { x, y, Az }
        // Note: simulation returns row-major (y changes in outer loop i, x in inner loop j)
        // But let's verify computePotential implementation.
        // Assuming simulation.computePotential returns grid similar to computeField
        
        const point = field[i][j]; 
        const { Az } = point;
        
        // Visualize magnitude of Az. Since Az can be negative, we might want a diverging colormap
        // or just absolute value. 
        // Usually potential maps are visualized with color for value (positive/negative).
        // Let's use a simple color mapping: Blue (neg) -> White (0) -> Red (pos) ?
        // Or using the existing 'getColor' which seems to take log magnitude.
        
        // Let's look at getColor. It takes (value, min, max).
        // If it's log magnitude, it ignores sign.
        // Let's use absolute value for intensity and maybe color for sign?
        
        // For now, let's use a simple mapping.
        // Visualize magnitude of Az
        // Use getPotentialColor which handles log scaling and sign
        // Range roughly -9 to -4 based on previous implementation values
        
        const color = getPotentialColor(Az, -9, -4);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        
        const cx = (j / (resolution - 1)) * width;
        const cy = height - (i / (resolution - 1)) * height; // Invert Y
        
        // Draw standard physics notation for vectors perpendicular to plane
        // Circle with dot for Out (Positive), Circle with cross for In (Negative)
        // Size scales with resolution but let's keep it visible
        const radius = (Math.min(cellWidth, cellHeight) / 2) * 0.8;
        
        if (radius < 2) {
            // Fallback to squares if too small
            ctx.fillRect(cx - cellWidth/2, cy - cellHeight/2, cellWidth, cellHeight);
        } else {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.stroke();
            
            if (Az > 0) {
                // Dot (Out)
                ctx.beginPath();
                ctx.arc(cx, cy, 1, 0, 2 * Math.PI); // Small dot
                ctx.fill();
            } else {
                // Cross (In)
                const rInner = radius * 0.6;
                ctx.beginPath();
                ctx.moveTo(cx - rInner, cy - rInner);
                ctx.lineTo(cx + rInner, cy + rInner);
                ctx.moveTo(cx + rInner, cy - rInner);
                ctx.lineTo(cx - rInner, cy + rInner);
                ctx.stroke();
            }
        }
      }
    }

    // Draw objects (reuse code from ArrowVisualization)
    // Helper functions for coordinate conversion
    const toCanvasX = (x) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * width;
    const toCanvasY = (y) => height - ((y - yRange[0]) / (yRange[1] - yRange[0])) * height;

    simulation.objects.forEach(obj => {
      const cx = toCanvasX(obj.x);
      const cy = toCanvasY(obj.y);
      const radiusX = (obj.radius / (xRange[1] - xRange[0])) * width;
      const lengthY = (obj.length / (yRange[1] - yRange[0])) * height;

      if (obj.type === 'coil') {
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cx - radiusX, cy - lengthY / 2, radiusX * 2, lengthY);
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fill();
      } else if (obj.type === 'magnet') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((90 - (obj.angle ?? 90)) * Math.PI / 180);

        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-radiusX, -lengthY / 2, radiusX * 2, lengthY);
        ctx.setLineDash([]);

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      } else if (obj.type === 'measurementCoil') {
        // Draw measurement coil in green with solid line
        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(cx - radiusX, cy - lengthY / 2, radiusX * 2, lengthY);

        // Center mark
        ctx.fillStyle = '#00aa00';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Display induced current at the center (in mA for readability)
        const currentMA = obj.inducedCurrent * 1000;
        const currentText = `${currentMA.toFixed(2)} mA`;
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw white background for readability
        const textMetrics = ctx.measureText(currentText);
        const padding = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(
          cx - textMetrics.width / 2 - padding,
          cy - 8 - padding,
          textMetrics.width + padding * 2,
          16 + padding * 2
        );
        
        ctx.fillStyle = '#00aa00';
        ctx.fillText(currentText, cx, cy);
      }
    });

  }, [simulation, version, xRange, yRange, resolution]);

  // Mouse event handlers (copy from ArrowVisualization)
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = xRange[0] + (mouseX / canvas.width) * (xRange[1] - xRange[0]);
    const worldY = yRange[1] - (mouseY / canvas.height) * (yRange[1] - yRange[0]);

    for (const obj of simulation.objects) {
      const dx = worldX - obj.x;
      const dy = worldY - obj.y;

      if (Math.abs(dx) < obj.radius && Math.abs(dy) < obj.length / 2) {
        dragState.current = {
          isDragging: true,
          objectId: obj.id,
          offsetX: dx,
          offsetY: dy
        };
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.isDragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = xRange[0] + (mouseX / canvas.width) * (xRange[1] - xRange[0]);
    const worldY = yRange[1] - (mouseY / canvas.height) * (yRange[1] - yRange[0]);

    const newX = worldX - dragState.current.offsetX;
    const newY = worldY - dragState.current.offsetY;

    onObjectDrag(dragState.current.objectId, newX, newY);
  };

  const handleMouseUp = () => {
    dragState.current.isDragging = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: '1px solid #ccc', cursor: dragState.current.isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default PotentialVisualization;

