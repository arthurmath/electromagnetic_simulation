export const getColor = (value, min, max) => {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Plasma colormap approximation
  const r = Math.floor(255 * (0.05 + 0.9 * Math.pow(t, 2)));
  const g = Math.floor(255 * (0.3 + 0.5 * Math.sin(Math.PI * t)));
  const b = Math.floor(255 * (0.9 - 0.85 * t));
  
  return `rgb(${r}, ${g}, ${b})`;
};

