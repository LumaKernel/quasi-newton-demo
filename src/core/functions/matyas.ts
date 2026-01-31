import type { ObjectiveFunction } from './types.ts';

/**
 * Matyas function
 * f(x, y) = 0.26(x² + y²) - 0.48xy
 *
 * Global minimum: (0, 0) with f = 0
 * Simple bowl-shaped function
 */
export const matyas: ObjectiveFunction = {
  id: 'matyas',
  name: 'Matyas',
  description: 'f(x,y) = 0.26(x² + y²) - 0.48xy',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-10, 10, -10, 10],
  defaultStart: [5, -5],

  value: ([x, y]) => {
    return 0.26 * (x * x + y * y) - 0.48 * x * y;
  },

  gradient: ([x, y]) => {
    const dx = 0.52 * x - 0.48 * y;
    const dy = 0.52 * y - 0.48 * x;
    return [dx, dy];
  },

  hessian: () => {
    // Constant Hessian
    return [
      [0.52, -0.48],
      [-0.48, 0.52],
    ];
  },
};
