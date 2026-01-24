/**
 * Coil and Magnet classes
 */

import { getBr, getBz, getLoopAphi } from './functions.js';

const MU_0 = 4 * Math.PI * 1e-7;

export class Coil {
  constructor(x, y, radius=0.03, length=0.05, nTurns=100, current=2.0, mu=MU_0) { 
    this.type = 'coil';
    this.id = Math.random().toString(36).substr(2, 9);
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.length = length;
    this.nTurns = nTurns;
    this.current = current;
    this.baseCurrent = current;
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

  potential(x, y) {
    // Calculate vector potential A_z (which corresponds to A_phi in coil coords)
    // We sum up the contribution of nTurns loops
    
    // Radial distance from coil axis (same as field calculation)
    const r = Math.abs(x - this.x);
    // Axial position relative to coil center
    const z = y - this.y;
    
    // Sign convention: 
    // For By > 0 inside solenoid (positive current), Az must decrease with x (slope < 0).
    // Az approx -B*x for small x. So sign depends on x.
    // If x > this.x, (x-this.x) > 0, so Az < 0.
    // If x < this.x, (x-this.x) < 0, so Az > 0.
    
    const sign_x = x - this.x >= 0 ? 1 : -1;
    
    let Az = 0;
    
    // We approximate the solenoid as nTurns discrete loops
    const dz = this.length / this.nTurns;
    
    for (let i = 0; i < this.nTurns; i++) {
        // z position of the loop relative to coil center
        const loop_z_offset = -this.length / 2 + (i + 0.5) * dz;
        const dist_z = z - loop_z_offset;
        
        const loop_A = getLoopAphi(this.radius, this.mu, this.current, r, dist_z);
        Az += loop_A;
    }
    
    Az = -Az * sign_x;
    
    return { Az };
  }

  clone() {
    return new Coil(this.x, this.y, this.radius, this.length, this.nTurns, this.current, this.mu);
  }
}

export class MeasurementCoil {
  constructor(x, y, radius = 0.03, length = 0.05, nTurns = 200, resistance = 10) {
    this.type = 'measurementCoil';
    this.id = Math.random().toString(36).substr(2, 9);
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.length = length;
    this.nTurns = nTurns;
    this.resistance = resistance;
    
    // Induced current state
    this.inducedCurrent = 0;
    this.previousFlux = null;
  }

  // MeasurementCoil does not generate magnetic field - it only measures
  field(x, y) {
    return { Bx: 0, By: 0 };
  }

  potential(x, y) {
    return { Az: 0 };
  }

  // Compute the magnetic flux through the coil from external fields
  // Uses average B field at the center times area (simple approximation)
  computeFlux(simulation) {
    // Get B field at center of coil (excluding self since we don't generate field)
    let Bx = 0, By = 0;
    for (const obj of simulation.objects) {
      if (obj.id === this.id) continue; // Skip self
      const { Bx: bx, By: by } = obj.field(this.x, this.y);
      Bx += bx;
      By += by;
    }
    
    // The coil is oriented along Y axis, so flux is By * Area
    // Area = pi * r^2, and we have nTurns loops
    const area = Math.PI * this.radius * this.radius;
    const flux = By * area * this.nTurns;
    
    return flux;
  }

  // Update induced current using Faraday's law: e = -dΦ/dt, I = e/R
  updateInducedCurrent(simulation, dt) {
    const currentFlux = this.computeFlux(simulation);
    
    if (this.previousFlux !== null && dt > 0) {
      const dFlux = currentFlux - this.previousFlux;
      const e = -dFlux / dt;
      this.inducedCurrent = e / this.resistance;
    }
    
    this.previousFlux = currentFlux;
    return this.inducedCurrent;
  }

  clone() {
    const clone = new MeasurementCoil(this.x, this.y, this.radius, this.length, this.nTurns, this.resistance);
    clone.inducedCurrent = this.inducedCurrent;
    clone.previousFlux = this.previousFlux;
    return clone;
  }
}

export class Magnet {
  constructor(x, y, moment = 0.1, angle = 90, mu = MU_0) {
    this.type = 'magnet';
    this.id = Math.random().toString(36).substr(2, 9);
    this.x = x;
    this.y = y;
    this.radius = 0.005;
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

  potential(x, y) {
    // Vector potential for magnetic dipole
    // A = (mu / 4pi) * (m x r) / r^3
    // In 2D plane (z=0), m = (mx, my, 0), r = (dx, dy, 0)
    // m x r = (0, 0, mx*dy - my*dx)
    // So Az = (mu / 4pi) * (mx*dy - my*dx) / r^3
    
    const dx = x - this.x;
    const dy = y - this.y;
    const r_sq = dx * dx + dy * dy;
    const r = Math.sqrt(r_sq);
    
    if (r < 1e-10) return { Az: 0 };

    const angleRad = this.angle * Math.PI / 180;
    const mx = this.moment * Math.cos(angleRad);
    const my = this.moment * Math.sin(angleRad);
    
    const cross_z = mx * dy - my * dx;
    
    const Az = (this.mu / (4 * Math.PI)) * cross_z / Math.pow(r, 3);
    
    return { Az };
  }

  clone() {
    return new Magnet(this.x, this.y, this.moment, this.angle, this.mu);
  }
}

