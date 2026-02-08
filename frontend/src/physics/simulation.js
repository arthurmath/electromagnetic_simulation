/**
 * Magnetic field simulation engine
 */

export class MagneticFieldSimulation {
  constructor(objects = []) {
    this.objects = objects;
  }

  addObject(obj) {
    this.objects.push(obj);
  }

  removeObject(id) {
    this.objects = this.objects.filter(obj => obj.id !== id);
  }

  updateObject(id, updates) {
    const obj = this.objects.find(obj => obj.id === id);
    if (obj) {
      Object.assign(obj, updates);
    }
  }

  // Update rope dipole alignments based on external fields
  updateRopes() {
    for (const obj of this.objects) {
      if (obj.type === 'rope') {
        obj.updateAlignment(this);
      }
    }
  }

  computeField(xRange, yRange, resolution) {
    // Update rope alignments before computing field
    this.updateRopes();

    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;

    const xStep = (xMax - xMin) / (resolution - 1);
    const yStep = (yMax - yMin) / (resolution - 1);

    const field = [];

    for (let i = 0; i < resolution; i++) {
      const row = [];
      for (let j = 0; j < resolution; j++) {
        const x = xMin + j * xStep;
        const y = yMin + i * yStep;

        let Bx = 0;
        let By = 0;

        for (const obj of this.objects) {
          const { Bx: bx, By: by } = obj.field(x, y);
          Bx += bx;
          By += by;
        }

        row.push({ x, y, Bx, By });
      }
      field.push(row);
    }

    return field;
  }

  computePotential(xRange, yRange, resolution) {
    // Update rope alignments before computing potential
    this.updateRopes();

    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;

    const xStep = (xMax - xMin) / (resolution - 1);
    const yStep = (yMax - yMin) / (resolution - 1);

    const field = [];

    for (let i = 0; i < resolution; i++) {
      const row = [];
      for (let j = 0; j < resolution; j++) {
        const x = xMin + j * xStep;
        const y = yMin + i * yStep;

        let Az = 0;

        for (const obj of this.objects) {
            if (obj.potential) {
                const { Az: az } = obj.potential(x, y);
                Az += az;
            }
        }

        row.push({ x, y, Az });
      }
      field.push(row);
    }

    return field;
  }

  // Compute field at a single point
  computeLine(x, y) {
    let Bx = 0;
    let By = 0;

    for (const obj of this.objects) {
      const { Bx: bx, By: by } = obj.field(x, y);
      Bx += bx;
      By += by;
    }

    return { Bx, By };
  }

  // Update all measurement coils with their induced currents
  updateMeasurementCoils(dt) {
    for (const obj of this.objects) {
      if (obj.type === 'measurementCoil') {
        obj.updateInducedCurrent(this, dt);
      }
    }
  }

  // Step rope mechanical simulation
  stepRopeMechanics(dt) {
    for (const obj of this.objects) {
      if (obj.type === 'rope') {
        obj.stepMechanics(this, dt);
      }
    }
  }
}

