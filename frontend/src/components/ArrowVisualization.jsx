import React, { useEffect, useRef } from 'react';
import { getColor } from '../physics/color';

const ArrowVisualization = ({ simulation, version, xRange, yRange, resolution, onObjectClick, onObjectDrag }) => {
  const canvasRef = useRef(null);
  const dragState = useRef({ isDragging: false, objectId: null, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Compute field
    const field = simulation.computeField(xRange, yRange, resolution);

    // Helper functions for coordinate conversion
    const toCanvasX = (x) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * width;
    const toCanvasY = (y) => height - ((y - yRange[0]) / (yRange[1] - yRange[0])) * height;

    // Draw arrows
    const arrowScale = Math.min(width, height) / resolution / 2;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const point = field[i][j];
        const { x, y, Bx, By } = point;

        const magnitude = Math.sqrt(Bx * Bx + By * By);
        if (magnitude < 1e-20) continue;

        // Normalize
        const nx = Bx / magnitude;
        const ny = By / magnitude;

        // Canvas coordinates
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);

        // Color based on magnitude
        const logMag = Math.log10(magnitude + 1e-20);
        const color = getColor(logMag, -8, -2);

        // Arrow length based on intensity
        const minLog = -8;
        const maxLog = -2;
        const intensity = Math.max(0, Math.min(1, (logMag - minLog) / (maxLog - minLog)));
        const arrowLen = arrowScale * (0.5 + 1.5 * intensity);

        const ex = cx + nx * arrowLen;
        const ey = cy - ny * arrowLen; // Invert y for canvas

        // Draw arrow
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrow head
        const headLen = 5;
        const angle = Math.atan2(ey - cy, ex - cx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw objects
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

        // Center mark
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

        // Center mark
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      }
    });

  }, [simulation, version, xRange, yRange, resolution]);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = xRange[0] + (mouseX / canvas.width) * (xRange[1] - xRange[0]);
    const worldY = yRange[1] - (mouseY / canvas.height) * (yRange[1] - yRange[0]);

    // Check if clicking on an object
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

export default ArrowVisualization;

