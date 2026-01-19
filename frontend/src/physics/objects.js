/**
 * Coil and Magnet classes
 * Ported from simulation.py
 */

import { getBr, getBz } from './functions.js';

const MU_0 = 4 * Math.PI * 1e-7;

export class Coil {
  constructor(x, y, radius, length, nTurns, current, mu = MU_0) {
    this.type = 'coil';
    this.id = Math.random().toString(36).substr(2, 9);
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.length = length;
    this.nTurns = nTurns;
    this.current = current;
    this.mu = mu;
    this.n = nTurns / length; // turns per unit length
  }

  field(x, y) {
    // Radial distance from coil axis
    const r = Math.abs(x - this.x);
    // Axial position relative to coil center
    const z = y - this.y;

    const ksi_low = z - this.length / 2;
    const ksi_high = z + this.length / 2;

    // Get cylindrical field components
    const Br = getBr(this.radius, this.mu, this.n, this.current, r, ksi_low, ksi_high);
    const Bz = getBz(this.radius, this.mu, this.n, this.current, r, ksi_low, ksi_high);

    // Convert to Cartesian: Br points radially outward
    const sign_x = x - this.x === 0 ? 1 : Math.sign(x - this.x);

    const Bx = -Br * sign_x;
    const By = Bz;

    return { Bx, By };
  }

  clone() {
    return new Coil(this.x, this.y, this.radius, this.length, this.nTurns, this.current, this.mu);
  }
}

export class Magnet {
  constructor(x, y, moment = 0.1, angle = 90, mu = MU_0) {
    this.type = 'magnet';
    this.id = Math.random().toString(36).substr(2, 9);
    this.x = x;
    this.y = y;
    this.radius = 0.01;
    this.length = 0.03;
    this.moment = moment;
    this.angle = angle;
    this.mu = mu;
  }

  field(x, y) {
    // Position relative to dipole center
    const dx = x - this.x;
    const dy = y - this.y;

    // Distance from dipole
    const r_sq = dx * dx + dy * dy;
    const r = Math.max(Math.sqrt(r_sq), 1e-10);

    // // Dipole field components (for dipole along y-axis)
    // let Bx = this.mu * this.moment / (4 * Math.PI) * (3 * dx * dy) / Math.pow(r, 5);
    // let By = this.mu * this.moment / (4 * Math.PI) * (2 * dy * dy - dx * dx) / Math.pow(r, 5);

    // Dipole field components (for all angles)
    const angleRad = this.angle * Math.PI / 180;
    const mx = this.moment * Math.cos(angleRad);
    const my = this.moment * Math.sin(angleRad);
    const dot_mr = mx * dx + my * dy;

    let Bx = this.mu / (4 * Math.PI * Math.pow(r, 5)) * (3 * dot_mr * dx - mx * r_sq);
    let By = this.mu / (4 * Math.PI * Math.pow(r, 5)) * (3 * dot_mr * dy - my * r_sq);

    // Set field to zero at dipole location
    if (r < 1e-10) {
      Bx = 0;
      By = 0;
    }

    return { Bx, By };
  }

  clone() {
    return new Magnet(this.x, this.y, this.moment, this.angle, this.mu);
  }
}

