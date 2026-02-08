/**
 * Magnetic field calculation functions
 */

import { ellipk, ellipe, heuman_lambda } from './elliptic.js';

export function getPhi(r, a, ksi) {
  return Math.atan(Math.abs(ksi / (a - r)));
}

export function getK(a, r, ksi) {
  let denom = ksi * ksi + (a + r) * (a + r);
  if (denom === 0) denom = 1e-12;
  
  let k_sq = (4 * a * r) / denom;
  k_sq = Math.max(0, Math.min(0.9999, k_sq));
  
  return Math.sqrt(k_sq);
}

export function getBr(a, mu, n, current, r, ksi_low, ksi_high) {
  // Handle r=0 (on axis) - Br is zero by symmetry
  if (r < 1e-10) return 0;
  
  const k_high = Math.max(getK(a, r, ksi_high), 1e-10);
  const k_low = Math.max(getK(a, r, ksi_low), 1e-10);
  
  const K_high = ellipk(k_high * k_high);
  const E_high = ellipe(k_high * k_high);
  const K_low = ellipk(k_low * k_low);
  const E_low = ellipe(k_low * k_low);
  
  const Br_high = (mu * n * current / Math.PI) * Math.sqrt(a / r) * (((2 - k_high * k_high) / (2 * k_high)) * K_high - E_high / k_high);
  const Br_low = (mu * n * current / Math.PI) * Math.sqrt(a / r) * (((2 - k_low * k_low) / (2 * k_low)) * K_low - E_low / k_low);
  
  return Br_high - Br_low;
}

export function getBz(a, mu, n, current, r, ksi_low, ksi_high) {
  // On axis approximation for solenoid
  if (r < 1e-10) return mu * n * current;
  
  const k_high = Math.max(getK(a, r, ksi_high), 1e-10);
  const k_low = Math.max(getK(a, r, ksi_low), 1e-10);
  
  const K_high = ellipk(k_high * k_high);
  const K_low = ellipk(k_low * k_low);
  
  const sqrt_ar = Math.max(Math.sqrt(a * r), 1e-10);
  
  const phi_high = getPhi(r, a, ksi_high);
  const phi_low = getPhi(r, a, ksi_low);
  
  const product_high = (a - r) * ksi_high;
  const product_low = (a - r) * ksi_low;
  const sign_high = product_high === 0 ? 0 : product_high / Math.abs(product_high);
  const sign_low = product_low === 0 ? 0 : product_low / Math.abs(product_low);
  
  const Bz_high = (mu * n * current / 4) * (((ksi_high * k_high) / (Math.PI * sqrt_ar) * K_high) + (sign_high * heuman_lambda(phi_high, k_high)));
  const Bz_low = (mu * n * current / 4) * (((ksi_low * k_low) / (Math.PI * sqrt_ar) * K_low) + (sign_low * heuman_lambda(phi_low, k_low)));
  
  return Bz_high - Bz_low;
}

export function getLoopAphi(a, mu, current, r, z) {
  // Vector potential A_phi for a single current loop of radius a
  // at z distance from plane.
  // A_phi = (mu * I / (pi * k)) * sqrt(a/r) * [(1 - k^2/2)K(k^2) - E(k^2)]
  
  if (r < 1e-10) return 0; // On axis, A_phi is zero by symmetry
  
  const k = getK(a, r, z);
  const k_sq = k * k;
  
  // Avoid division by zero if k is very small (far away)
  if (k < 1e-10) return 0;

  const K = ellipk(k_sq);
  const E = ellipe(k_sq);
  
  const term1 = (1 - k_sq / 2) * K - E;
  const Aphi = (mu * current / (Math.PI * k)) * Math.sqrt(a / r) * term1;
  
  return Aphi;
}

