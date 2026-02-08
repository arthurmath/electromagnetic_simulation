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

export class Dipole {
  /**
    Simulates an elementary dipole using the magnetic dipole model:
    B̂ = (μ0/4π) * [3(^m·r̂)r̂ - ^mr²] / r³
    
    The magnet is oriented along the y-direction (dipole moment points in +y or -y).
    Dipole approximation, correct far from the magnet.
    Position (x, y) represents the center of the magnet.
   * 
   * @param {*} x - position of the dipole
   * @param {*} y - position of the dipole
   * @param {*} moment - moment of the dipole (A m^-2)
   * @param {*} angle - angular position of the dipole
   * @param {*} mu - vaccum magnetic permeability
   */
  constructor(x, y, moment = 0.1, angle = 90, mu = MU_0) {
    this.type = 'dipole';
    this.x = x;
    this.y = y;
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
}

export class Magnet {
  /**
    Magnet is modelised as a surface density of Dipole objects.
   /**
    * @param {number} x - Center x position of the magnet (meters)
    * @param {number} y - Center y position of the magnet (meters)
    * @param {number} radius - x lenght of the magnet (meters)
    * @param {number} length - y lenght of the magnet (meters)
    * @param {number} n_x - Number of dipoles along x direction
    * @param {number} n_y - Number of dipoles along y direction
    * @param {number} moment - Total dipole moment of the magnet (A·m²)
    * @param {number} angle - Orientation of the magnet (degrees, 0 = x axis, 90 = y axis)
    * @param {number} mu - Magnetic permeability (default: vacuum permeability, H/m)
    */
  constructor(x, y, radius = 0.01, length = 0.06, n_x = 10, n_y = 20, moment = 0.1, angle = 90, mu = MU_0) {
    this.type = 'magnet';
    this.id = Math.random().toString(36).substr(2, 9);
    this._x = x;
    this._y = y;
    this._radius = radius;
    this._length = length;
    this._n_x = n_x;
    this._n_y = n_y;
    this._moment = moment;
    this._angle = angle;
    this._mu = mu;
    this._dirty = true;
    this._dipoles = [];
  }

  // Getters and setters to track changes and regenerate dipoles
  get x() { return this._x; }
  set x(val) { this._x = val; this._dirty = true; }
  
  get y() { return this._y; }
  set y(val) { this._y = val; this._dirty = true; }
  
  get radius() { return this._radius; }
  set radius(val) { this._radius = val; this._dirty = true; }
  
  get length() { return this._length; }
  set length(val) { this._length = val; this._dirty = true; }
  
  get n_x() { return this._n_x; }
  set n_x(val) { this._n_x = val; this._dirty = true; }
  
  get n_y() { return this._n_y; }
  set n_y(val) { this._n_y = val; this._dirty = true; }
  
  get moment() { return this._moment; }
  set moment(val) { this._moment = val; this._dirty = true; }
  
  get angle() { return this._angle; }
  set angle(val) { this._angle = val; this._dirty = true; }
  
  get mu() { return this._mu; }
  set mu(val) { this._mu = val; this._dirty = true; }

  get dipoles() {
    if (this._dirty) {
      this._dipoles = this._createDipoles();
      this._dirty = false;
    }
    return this._dipoles;
  }

  _createDipoles() {
    const dipoles = [];
    const numDipoles = this._n_x * this._n_y;
    const dipoleMoment = this._moment / numDipoles;
    
    // Angle in radians for orientation
    const angleRad = this._angle * Math.PI / 180;
    
    // Unit vectors along and perpendicular to magnet axis
    const axisX = Math.cos(angleRad);
    const axisY = Math.sin(angleRad);
    const perpX = -Math.sin(angleRad);
    const perpY = Math.cos(angleRad);
    
    // Distribute dipoles on a rectangular grid
    // Along the length (axis direction) and across the radius (perpendicular)
    for (let i = 0; i < this._n_y; i++) {
      // Position along the length axis (-length/2 to +length/2)
      const t = this._n_y === 1 ? 0 : (i / (this._n_y - 1) - 0.5) * this._length;
      
      for (let j = 0; j < this._n_x; j++) {
        // Position across the radius (-radius to +radius)
        const s = this._n_x === 1 ? 0 : (j / (this._n_x - 1) - 0.5) * 2 * this._radius;
        
        // Compute dipole position
        const dipoleX = this._x + t * axisX + s * perpX;
        const dipoleY = this._y + t * axisY + s * perpY;
        
        dipoles.push(new Dipole(dipoleX, dipoleY, dipoleMoment, this._angle, this._mu));
      }
    }
    
    return dipoles;
  }

  field(x, y) {
    let Bx = 0;
    let By = 0;
    
    for (const dipole of this.dipoles) {
      const { Bx: bx, By: by } = dipole.field(x, y);
      Bx += bx;
      By += by;
    }
    
    return { Bx, By };
  }

  potential(x, y) {
    let Az = 0;
    
    for (const dipole of this.dipoles) {
      const { Az: az } = dipole.potential(x, y);
      Az += az;
    }
    
    return { Az };
  }

  clone() {
    return new Magnet(this._x, this._y, this._radius, this._length, this._n_x, this._n_y, this._moment, this._angle, this._mu);
  }
}

export class Rope {
  /**
   * Rope simulated as a linear density of Dipole objects with mechanical dynamics.
   * Solves the 1D wave equation: ρ ∂²u/∂t² = T ∂²u/∂x² - γ ∂u/∂t + f(x,t)
   * with clamped-clamped boundary conditions: u(0,t) = u(L,t) = 0
   * Magnetic force: f(x,t) = density * ∂(m·B)/∂y
   *
   * @param {number} y - y position (meters) where the rope is horizontally centered
   * @param {number} length - total length of the rope (meters)
   * @param {number} density - number of dipoles per meter (1/m)
   * @param {number} dipoleMoment - magnetic dipole moment of each dipole (A·m²)
   * @param {number} mu - magnetic permeability (default: vacuum permeability, H/m)
   * @param {number} tension - rope tension (N)
   * @param {number} lineMassDensity - mass per unit length (kg/m)
   * @param {number} damping - damping coefficient (kg/(m·s))
   */
  constructor(y, length = 0.3, density = 500, dipoleMoment = 1e-6, mu = MU_0,
              tension = 70, lineMassDensity = 3.5e-3, damping = 0.5) {
    this.type = 'rope';
    this.id = Math.random().toString(36).substr(2, 9);
    this._y = y;
    this._length = length;
    this._density = density; // dipoles per meter
    this._dipoleMoment = dipoleMoment;
    this._mu = mu;
    this._tension = tension;
    this._lineMassDensity = lineMassDensity;
    this._damping = damping;
    this.dipoles = [];
    this.displacement = null;
    this.velocity = null;
    
    this._createDipoles();
  }

  // Getters and setters to update dipoles when properties change
  get y() { return this._y; }
  set y(val) { 
    this._y = val; 
    this._updateDipolePositions();
  }
  
  get length() { return this._length; }
  set length(val) { 
    this._length = val; 
    this._createDipoles();
  }
  
  get density() { return this._density; }
  set density(val) { 
    this._density = val; 
    this._createDipoles();
  }
  
  get dipoleMoment() { return this._dipoleMoment; }
  set dipoleMoment(val) { 
    this._dipoleMoment = val; 
    this._createDipoles();
  }
  
  get mu() { return this._mu; }
  set mu(val) { 
    this._mu = val; 
    this._createDipoles();
  }

  get tension() { return this._tension; }
  set tension(val) { this._tension = val; }

  get lineMassDensity() { return this._lineMassDensity; }
  set lineMassDensity(val) { this._lineMassDensity = val; }

  get damping() { return this._damping; }
  set damping(val) { this._damping = val; }

  // Rope position is fixed horizontally, so x getter returns center (0)
  get x() { return 0; }
  // Prevent horizontal position changes
  set x(val) { /* fixed position */ }

  _createDipoles() {
    this.dipoles = [];
    const numDipoles = Math.max(1, Math.round(this._length * this._density));
    const spacing = this._length / numDipoles;
    const startX = -this._length / 2;
    
    for (let i = 0; i < numDipoles; i++) {
      const x = startX + (i + 0.5) * spacing;
      this.dipoles.push(new Dipole(x, this._y, this._dipoleMoment, 0, this._mu));
    }

    // Initialize mechanical state
    this.displacement = new Float64Array(numDipoles);
    this.velocity = new Float64Array(numDipoles);
  }

  // Update Y positions of existing dipoles (respects displacement)
  _updateDipolePositions() {
    for (let i = 0; i < this.dipoles.length; i++) {
      this.dipoles[i].y = this._y + (this.displacement ? this.displacement[i] : 0);
    }
  }

  // Update dipole alignments based on external magnetic field
  updateAlignment(simulation) {
    for (const dipole of this.dipoles) {
      let Bx = 0;
      let By = 0;
      for (const obj of simulation.objects) {
        if (obj.id === this.id) continue;
        const { Bx: bx, By: by } = obj.field(dipole.x, dipole.y);
        Bx += bx;
        By += by;
      }
      
      const magnitude = Math.sqrt(Bx * Bx + By * By);
      if (magnitude > 1e-15) {
        dipole.angle = Math.atan2(By, Bx) * 180 / Math.PI;
      }
    }
  }

  /**
   * Step the mechanical simulation of the rope.
   * Solves: ρ ∂²u/∂t² = T ∂²u/∂x² - γ ∂u/∂t + f(x,t)
   * where f(x,t) = ∂(m·B)/∂y per unit length (magnetic force)
   */
  stepMechanics(simulation, dt) {
    const n = this.dipoles.length;
    if (n < 3 || dt <= 0) return;

    // Ensure mechanical arrays exist
    if (!this.displacement || this.displacement.length !== n) {
      this.displacement = new Float64Array(n);
      this.velocity = new Float64Array(n);
    }

    // Cap physics dt to prevent instability when frames are slow
    dt = Math.min(dt, 0.02);

    const dx = this._length / n;
    const c2 = this._tension / this._lineMassDensity; // wave speed squared

    // CFL stability condition: subDt must be < dx / c for stability
    const dtMax = 0.5 * dx / Math.sqrt(c2);
    const nSubsteps = Math.max(1, Math.ceil(dt / dtMax));
    const subDt = dt / nSubsteps;

    // Compute magnetic force per unit length at each interior point (once per frame)
    const force = new Float64Array(n);
    const delta = 1e-5; // for numerical gradient of B

    for (let i = 1; i < n - 1; i++) {
      const dipole = this.dipoles[i];
      const xPos = dipole.x;
      const yPos = this._y + this.displacement[i];

      const angleRad = dipole.angle * Math.PI / 180;
      const mx = dipole.moment * Math.cos(angleRad);
      const my = dipole.moment * Math.sin(angleRad);

      let mDotB_plus = 0;
      let mDotB_minus = 0;

      for (const obj of simulation.objects) {
        if (obj.id === this.id) continue;

        const { Bx: bxP, By: byP } = obj.field(xPos, yPos + delta);
        const { Bx: bxM, By: byM } = obj.field(xPos, yPos - delta);

        mDotB_plus += mx * bxP + my * byP;
        mDotB_minus += mx * bxM + my * byM;
      }

      // Fy per dipole = d(m·B)/dy, force per unit length = Fy * dipoles_per_meter
      const Fy = (mDotB_plus - mDotB_minus) / (2 * delta);
      force[i] = Fy * this._density;
    }

    // Time-step the wave equation using double-buffered explicit scheme
    // (Jacobi update — reads only from the previous step, avoiding Gauss-Seidel drift)
    const invRho = 1.0 / this._lineMassDensity;

    let currDisp = this.displacement;
    let currVel = this.velocity;
    let nextDisp = new Float64Array(n); // boundaries stay 0
    let nextVel = new Float64Array(n);

    for (let step = 0; step < nSubsteps; step++) {
      for (let i = 1; i < n - 1; i++) {
        const d2u = (currDisp[i + 1] - 2 * currDisp[i] + currDisp[i - 1]) / (dx * dx);
        const accel = c2 * d2u - this._damping * invRho * currVel[i] + force[i] * invRho;

        nextVel[i] = currVel[i] + accel * subDt;
        nextDisp[i] = currDisp[i] + nextVel[i] * subDt;
      }
      // Swap buffers (boundary values remain 0 from initialization)
      const tmpD = currDisp; currDisp = nextDisp; nextDisp = tmpD;
      const tmpV = currVel;  currVel = nextVel;  nextVel = tmpV;
    }

    this.displacement = currDisp;
    this.velocity = currVel;

    // // Safety: if NaN crept in, reset everything
    // if (isNaN(currDisp[Math.floor(n / 2)])) {
    //   this.displacement = new Float64Array(n);
    //   this.velocity = new Float64Array(n);
    // }

    // Update dipole y positions to reflect displacement
    for (let i = 0; i < n; i++) {
      this.dipoles[i].y = this._y + this.displacement[i];
    }
  }

  resetMechanics() {
    const n = this.dipoles.length;
    this.displacement = new Float64Array(n);
    this.velocity = new Float64Array(n);
    this._updateDipolePositions();
  }

  field(x, y) {
    let Bx = 0;
    let By = 0;
    
    for (const dipole of this.dipoles) {
      const { Bx: bx, By: by } = dipole.field(x, y);
      Bx += bx;
      By += by;
    }
    
    return { Bx, By };
  }

  potential(x, y) {
    let Az = 0;
    
    for (const dipole of this.dipoles) {
      const { Az: az } = dipole.potential(x, y);
      Az += az;
    }
    
    return { Az };
  }

  clone() {
    const clone = new Rope(this._y, this._length, this._density, this._dipoleMoment, this._mu,
                            this._tension, this._lineMassDensity, this._damping);
    for (let i = 0; i < this.dipoles.length; i++) {
      clone.dipoles[i].angle = this.dipoles[i].angle;
    }
    if (this.displacement) {
      clone.displacement = new Float64Array(this.displacement);
      clone.velocity = new Float64Array(this.velocity);
    }
    return clone;
  }
}

