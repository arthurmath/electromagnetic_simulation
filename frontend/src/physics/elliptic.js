/**
 * Elliptic integral functions
 */

// Complete elliptic integral of the first kind K(m)
export function ellipk(m) {
  // Using AGM (Arithmetic-Geometric Mean) method
  if (m === 1) return Infinity;
  if (m > 1) return NaN;
  
  const EPSILON = 1e-15;
  let a = 1;
  let g = Math.sqrt(1 - m);
  
  while (Math.abs(a - g) > EPSILON) {
    const temp = (a + g) / 2;
    g = Math.sqrt(a * g);
    a = temp;
  }
  
  return Math.PI / (2 * a);
}

// Complete elliptic integral of the second kind E(m)
export function ellipe(m) {
  if (m === 1) return 1;
  if (m > 1) return NaN;
  
  const EPSILON = 1e-15;
  let a = 1;
  let g = Math.sqrt(1 - m);
  let sum = 0;
  let pow = 1;
  
  while (Math.abs(a - g) > EPSILON) {
    const temp = (a + g) / 2;
    const c = (a - g) / 2;
    g = Math.sqrt(a * g);
    a = temp;
    sum += pow * c * c;
    pow *= 2;
  }
  
  return Math.PI / (2 * a) * (1 - 0.5 * m - sum);
}

// Incomplete elliptic integral of the first kind F(phi, m)
export function ellipkinc(phi, m) {
  if (Math.abs(phi) < 1e-10) return 0;
  
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  
  if (Math.abs(c) < 1e-10) return ellipk(m);
  
  // Carlson's elliptic integral RF
  const x = c * c;
  const y = 1 - m * s * s;
  const z = 1;
  
  return s * RF(x, y, z);
}

// Incomplete elliptic integral of the second kind E(phi, m)
export function ellipeinc(phi, m) {
  if (Math.abs(phi) < 1e-10) return 0;
  
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  
  if (Math.abs(c) < 1e-10) return ellipe(m);
  
  const x = c * c;
  const y = 1 - m * s * s;
  const z = 1;
  
  return s * (RF(x, y, z) - (m * s * s / 3) * RD(x, y, z));
}

// Carlson symmetric form RF
function RF(x, y, z) {
  const EPSILON = 1e-10;
  let A = (x + y + z) / 3;
  
  let X = x;
  let Y = y;
  let Z = z;
  
  for (let i = 0; i < 100; i++) {
    const lambda = Math.sqrt(X * Y) + Math.sqrt(Y * Z) + Math.sqrt(Z * X);
    X = (X + lambda) / 4;
    Y = (Y + lambda) / 4;
    Z = (Z + lambda) / 4;
    A = (A + lambda) / 4;
    
    const dx = 1 - X / A;
    const dy = 1 - Y / A;
    const dz = 1 - Z / A;
    
    if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) < EPSILON) {
      const E2 = dx * dy + dy * dz + dz * dx;
      const E3 = dy * dx * dz;
      
      return (1 - E2 / 10 + E3 / 14 + E2 * E2 / 24 - 3 * E2 * E3 / 44) / Math.sqrt(A);
    }
  }
  
  return 1 / Math.sqrt(A);
}

// Carlson symmetric form RD
function RD(x, y, z) {
  const EPSILON = 1e-10;
  let sum = 0;
  let fac = 1;
  
  let X = x;
  let Y = y;
  let Z = z;
  let A = (x + y + 3 * z) / 5;
  
  for (let i = 0; i < 100; i++) {
    const sqrtX = Math.sqrt(X);
    const sqrtY = Math.sqrt(Y);
    const sqrtZ = Math.sqrt(Z);
    const lambda = sqrtX * sqrtY + sqrtY * sqrtZ + sqrtZ * sqrtX;
    
    sum += fac / (sqrtZ * (Z + lambda));
    fac /= 4;
    
    X = (X + lambda) / 4;
    Y = (Y + lambda) / 4;
    Z = (Z + lambda) / 4;
    A = (A + lambda) / 4;
    
    const dx = 1 - X / A;
    const dy = 1 - Y / A;
    const dz = 1 - Z / A;
    
    if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) < EPSILON) {
      const E2 = dx * dy + dy * dz + 3 * dz * dz + 2 * dz * dx + dx * dz + 2 * dy * dz;
      const E3 = dz * dz * dz + dx * dz * dz + 3 * dx * dy * dz + 2 * dy * dz * dz + dy * dz * dz + 2 * dx * dz * dz;
      
      return 3 * sum + fac * (1 - 3 * E2 / 14 + E2 * E2 / 24 + 3 * E3 / 44) / (A * Math.sqrt(A));
    }
  }
  
  return 3 * sum + fac / (A * Math.sqrt(A));
}

// Heuman Lambda function
export function heuman_lambda(phi, k) {
  const kp = Math.sqrt(1 - k * k);
  
  const K = ellipk(k * k);
  const E = ellipe(k * k);
  
  const F_phi = ellipkinc(phi, kp * kp);
  const E_phi = ellipeinc(phi, kp * kp);
  
  return (2 / Math.PI) * (E * F_phi + K * E_phi - K * F_phi);
}

