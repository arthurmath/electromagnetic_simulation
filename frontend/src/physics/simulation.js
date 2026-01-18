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

  computeField(xRange, yRange, resolution) {
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

  // Compute field at a single point
  computeFieldAt(x, y) {
    let Bx = 0;
    let By = 0;

    for (const obj of this.objects) {
      const { Bx: bx, By: by } = obj.field(x, y);
      Bx += bx;
      By += by;
    }

    return { Bx, By };
  }
}

