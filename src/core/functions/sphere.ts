import type { ObjectiveFunction } from './types.ts';

/**
 * Sphere function
 * f(x, y) = x² + y²
 *
 * Global minimum: (0, 0) with f = 0
 * Simplest convex function, excellent for testing basic convergence
 */
export const sphere: ObjectiveFunction = {
  id: 'sphere',
  name: 'Sphere',
  description: 'f(x,y) = x² + y²',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-5, 5, -5, 5],
  defaultStart: [3, 3],

  value: ([x, y]) => {
    return x * x + y * y;
  },

  gradient: ([x, y]) => {
    return [2 * x, 2 * y];
  },

  hessian: () => {
    // Constant Hessian (identity scaled by 2)
    return [
      [2, 0],
      [0, 2],
    ];
  },
};
