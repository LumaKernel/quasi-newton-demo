import type { ObjectiveFunction } from './types.ts';

/**
 * Holder Table function
 * f(x, y) = -|sin(x)cos(y)exp(|1 - √(x²+y²)/π|)|
 *
 * Has 4 global minima at (±8.05502, ±9.66459) with f ≈ -19.2085
 */
export const holderTable: ObjectiveFunction = {
  id: 'holderTable',
  name: 'Holder Table',
  description: 'f(x,y) = -|sin(x)cos(y)exp(|1-√(x²+y²)/π|)|',
  dimension: 2,
  minima: [
    [8.05502, 9.66459],
    [8.05502, -9.66459],
    [-8.05502, 9.66459],
    [-8.05502, -9.66459],
  ],
  bounds: [-10, 10, -10, 10],
  defaultStart: [5, 5],

  value: ([x, y]) => {
    const r = Math.sqrt(x * x + y * y);
    const expTerm = Math.exp(Math.abs(1 - r / Math.PI));
    return -Math.abs(Math.sin(x) * Math.cos(y) * expTerm);
  },

  gradient: ([x, y]) => {
    // Numerical gradient due to absolute value complexity
    const h = 1e-7;
    const f = holderTable.value;
    const fx = (f([x + h, y]) - f([x - h, y])) / (2 * h);
    const fy = (f([x, y + h]) - f([x, y - h])) / (2 * h);
    return [fx, fy];
  },

  hessian: ([x, y]) => {
    const h = 1e-5;
    const grad = holderTable.gradient!;
    const g00 = grad([x, y]);
    const gx = grad([x + h, y]);
    const gy = grad([x, y + h]);

    return [
      [(gx[0] - g00[0]) / h, (gy[0] - g00[0]) / h],
      [(gx[1] - g00[1]) / h, (gy[1] - g00[1]) / h],
    ];
  },
};
