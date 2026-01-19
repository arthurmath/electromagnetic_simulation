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
        
        // Calculate canvas position
        // The grid points are centers or corners?
        // simulation.computeField uses loops:
        // x = xMin + j * xStep
        // y = yMin + i * yStep
        // We should draw a rect centered at x,y or starting there.
        // Resolution is points count. So we have (resolution-1) cells?
        // Or we just draw rects of size cellWidth centered on the point.
        
        // Ideally we use putImageData for pixel-perfect rendering, but grid is coarse (30x30).
        // Rects are fine.
        
        const cx = (j / (resolution - 1)) * width;
        const cy = height - (i / (resolution - 1)) * height; // Invert Y
        
        // Fill rect centered at cx, cy
        // We need to cover the gap.
        // distance between points is width/(res-1).
        const w = width / (resolution - 1);
        const h = height / (resolution - 1);
        
        ctx.fillRect(cx - w/2, cy - h/2, w+1, h+1); // +1 to avoid gaps
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

