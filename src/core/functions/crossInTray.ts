import type { ObjectiveFunction } from './types.ts';

/**
 * Cross-in-Tray function
 * f(x, y) = -0.0001(|sin(x)sin(y)exp(|100 - √(x²+y²)/π|)| + 1)^0.1
 *
 * Has 4 global minima at (±1.3491, ±1.3491) with f ≈ -2.0626
 */
export const crossInTray: ObjectiveFunction = {
  id: 'crossInTray',
  name: 'Cross-in-Tray',
  description: 'f(x,y) = -0.0001(|sin(x)sin(y)exp(...)| + 1)^0.1',
  dimension: 2,
  minima: [
    [1.3491, 1.3491],
    [1.3491, -1.3491],
    [-1.3491, 1.3491],
    [-1.3491, -1.3491],
  ],
  bounds: [-10, 10, -10, 10],
  defaultStart: [5, 5],

  value: ([x, y]) => {
    const r = Math.sqrt(x * x + y * y);
    const expTerm = Math.exp(Math.abs(100 - r / Math.PI));
    const inner = Math.abs(Math.sin(x) * Math.sin(y) * expTerm) + 1;
    return -0.0001 * Math.pow(inner, 0.1);
  },

  gradient: ([x, y]) => {
    // Numerical gradient due to complexity
    const h = 1e-7;
    const f = crossInTray.value;
    const fx = (f([x + h, y]) - f([x - h, y])) / (2 * h);
    const fy = (f([x, y + h]) - f([x, y - h])) / (2 * h);
    return [fx, fy];
  },

  hessian: ([x, y]) => {
    const h = 1e-5;
    const grad = crossInTray.gradient!;
    const g00 = grad([x, y]);
    const gx = grad([x + h, y]);
    const gy = grad([x, y + h]);

    return [
      [(gx[0] - g00[0]) / h, (gy[0] - g00[0]) / h],
      [(gx[1] - g00[1]) / h, (gy[1] - g00[1]) / h],
    ];
  },
};
