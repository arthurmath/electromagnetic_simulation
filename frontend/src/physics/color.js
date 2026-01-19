export const getColor = (value, min, max) => {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Plasma colormap approximation
  const r = Math.floor(255 * (0.05 + 0.9 * Math.pow(t, 2)));
  const g = Math.floor(255 * (0.3 + 0.5 * Math.sin(Math.PI * t)));
  const b = Math.floor(255 * (0.9 - 0.85 * t));
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const getPotentialColor = (value, minLog, maxLog) => {
  const absVal = Math.abs(value);
  const logVal = Math.log10(absVal + 1e-20);
  
  const norm = (logVal - minLog) / (maxLog - minLog);
  const clamped = Math.max(0, Math.min(1, norm));
  
  let r, g, b;
  
  if (value > 0) {
    // Red for positive
    r = 255;
    g = Math.floor(255 * (1 - clamped));
    b = Math.floor(255 * (1 - clamped));
  } else {
    // Blue for negative
    b = 255;
    r = Math.floor(255 * (1 - clamped));
    g = Math.floor(255 * (1 - clamped));
  }
  
  return `rgb(${r}, ${g}, ${b})`;
};

