import React, { useEffect, useRef } from 'react';

const LineVisualization = ({ simulation, version, xRange, yRange, resolution, density, onObjectDrag }) => {
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

    // Helper functions
    const toCanvasX = (x) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * width;
    const toCanvasY = (y) => height - ((y - yRange[0]) / (yRange[1] - yRange[0])) * height;
    const toWorldX = (cx) => xRange[0] + (cx / width) * (xRange[1] - xRange[0]);
    const toWorldY = (cy) => yRange[1] - (cy / height) * (yRange[1] - yRange[0]);

    // Generate streamlines
    const numLines = Math.floor(30 * density);
    const maxSteps = 1000;
    const stepSize = Math.min((xRange[1] - xRange[0]), (yRange[1] - yRange[0])) / resolution * 0.5;

    // Generate seed points in a grid pattern
    const seedPoints = [];
    const gridSize = Math.ceil(Math.sqrt(numLines));
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (seedPoints.length >= numLines) break;
        const x = xRange[0] + (j + 0.5) * (xRange[1] - xRange[0]) / gridSize;
        const y = yRange[0] + (i + 0.5) * (yRange[1] - yRange[0]) / gridSize;
        seedPoints.push({ x, y });
      }
    }

    // Trace streamlines
    seedPoints.forEach((seed) => {
      // Forward direction
      traceStreamline(seed.x, seed.y, 1, ctx, toCanvasX, toCanvasY, toWorldX, toWorldY, stepSize, maxSteps);
      // Backward direction
      traceStreamline(seed.x, seed.y, -1, ctx, toCanvasX, toCanvasY, toWorldX, toWorldY, stepSize, maxSteps);
    });

    // Draw objects
    simulation.objects.forEach(obj => {
      const cx = toCanvasX(obj.x);
      const cy = toCanvasY(obj.y);
      const radiusX = (obj.radius / (xRange[1] - xRange[0])) * width;
      const lengthY = (obj.length / (yRange[1] - yRange[0])) * height;

      if (obj.type === 'coil') {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cx - radiusX, cy - lengthY / 2, radiusX * 2, lengthY);
        ctx.setLineDash([]);

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fill();
      } else if (obj.type === 'magnet') {
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cx - radiusX, cy - lengthY / 2, radiusX * 2, lengthY);
        ctx.setLineDash([]);

        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

  }, [simulation, version, xRange, yRange, resolution, density]);

  const traceStreamline = (startX, startY, direction, ctx, toCanvasX, toCanvasY, toWorldX, toWorldY, stepSize, maxSteps) => {
    const points = [];
    let x = startX;
    let y = startY;
    let prevX = x;
    let prevY = y;

    for (let step = 0; step < maxSteps; step++) {
      // Check bounds
      if (x < xRange[0] || x > xRange[1] || y < yRange[0] || y > yRange[1]) {
        break;
      }

      const { Bx, By } = simulation.computeFieldAt(x, y);
      const magnitude = Math.sqrt(Bx * Bx + By * By);

      if (magnitude < 1e-20) break;

      // Normalize and apply direction
      const dx = direction * Bx / magnitude * stepSize;
      const dy = direction * By / magnitude * stepSize;

      x += dx;
      y += dy;

      points.push({ x, y, mag: magnitude });

      // Check if we've returned close to start (closed loop)
      const distToStart = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
      if (step > 10 && distToStart < stepSize * 2) {
        points.push({ x: startX, y: startY, mag: magnitude });
        break;
      }

      // Check if we're too close to previous point
      const dist = Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
      if (dist < stepSize * 0.1) break;

      prevX = x;
      prevY = y;
    }

    // Draw the streamline
    if (points.length < 2) return;

    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const logMag = Math.log10(point.mag + 1e-20);
      ctx.strokeStyle = getColor(logMag, -8, -2);
      
      ctx.lineTo(toCanvasX(point.x), toCanvasY(point.y));
      ctx.stroke();
      
      if (i < points.length - 1) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(point.x), toCanvasY(point.y));
      }
    }
  };

  const getColor = (value, min, max) => {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    
    // Viridis colormap approximation
    const r = Math.floor(255 * (0.27 + 0.1 * t - 0.3 * t * t));
    const g = Math.floor(255 * (0.0 + 0.9 * t - 0.3 * t * t));
    const b = Math.floor(255 * (0.33 + 0.5 * t));
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Mouse handlers (same as ArrowVisualization)
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

export default LineVisualization;

