import type { ObjectiveFunction } from './types.ts';

/**
 * Branin function (RCOS)
 * f(x, y) = a(y - bx² + cx - r)² + s(1 - t)cos(x) + s
 *
 * where a=1, b=5.1/(4π²), c=5/π, r=6, s=10, t=1/(8π)
 *
 * Has 3 global minima with f ≈ 0.397887
 */
export const branin: ObjectiveFunction = {
  id: 'branin',
  name: 'Branin',
  description: 'f(x,y) = (y-bx²+cx-r)² + s(1-t)cos(x) + s',
  dimension: 2,
  minima: [
    [-Math.PI, 12.275],
    [Math.PI, 2.275],
    [9.42478, 2.475],
  ],
  bounds: [-5, 10, 0, 15],
  defaultStart: [0, 10],

  value: ([x, y]) => {
    const a = 1;
    const b = 5.1 / (4 * Math.PI * Math.PI);
    const c = 5 / Math.PI;
    const r = 6;
    const s = 10;
    const t = 1 / (8 * Math.PI);

    const term1 = y - b * x * x + c * x - r;
    return a * term1 * term1 + s * (1 - t) * Math.cos(x) + s;
  },

  gradient: ([x, y]) => {
    const b = 5.1 / (4 * Math.PI * Math.PI);
    const c = 5 / Math.PI;
    const r = 6;
    const s = 10;
    const t = 1 / (8 * Math.PI);

    const term1 = y - b * x * x + c * x - r;
    // d(term1)/dx = -2bx + c
    const dTerm1Dx = -2 * b * x + c;

    // df/dx = 2 * term1 * dTerm1Dx - s(1-t)sin(x)
    const dx = 2 * term1 * dTerm1Dx - s * (1 - t) * Math.sin(x);

    // df/dy = 2 * term1 * 1
    const dy = 2 * term1;

    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const b = 5.1 / (4 * Math.PI * Math.PI);
    const c = 5 / Math.PI;
    const r = 6;
    const s = 10;
    const t = 1 / (8 * Math.PI);

    const term1 = y - b * x * x + c * x - r;
    const dTerm1Dx = -2 * b * x + c;

    // d²f/dx² = 2 * (dTerm1Dx)² + 2 * term1 * (-2b) - s(1-t)cos(x)
    const dxx = 2 * dTerm1Dx * dTerm1Dx + 2 * term1 * (-2 * b) - s * (1 - t) * Math.cos(x);

    // d²f/dxdy = 2 * dTerm1Dx
    const dxy = 2 * dTerm1Dx;

    // d²f/dy² = 2
    const dyy = 2;

    return [
      [dxx, dxy],
      [dxy, dyy],
    ];
  },
};
