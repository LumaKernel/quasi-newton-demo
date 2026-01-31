import type { ObjectiveFunction } from './types.ts';

/**
 * Booth function
 * f(x, y) = (x + 2y - 7)² + (2x + y - 5)²
 *
 * Global minimum: (1, 3) with f = 0
 */
export const booth: ObjectiveFunction = {
  id: 'booth',
  name: 'Booth',
  description: 'f(x,y) = (x + 2y - 7)² + (2x + y - 5)²',
  dimension: 2,
  minima: [[1, 3]],
  bounds: [-10, 10, -10, 10],
  defaultStart: [-5, 5],

  value: ([x, y]) => {
    const term1 = x + 2 * y - 7;
    const term2 = 2 * x + y - 5;
    return term1 * term1 + term2 * term2;
  },

  gradient: ([x, y]) => {
    const dx = 2 * (x + 2 * y - 7) + 4 * (2 * x + y - 5);
    const dy = 4 * (x + 2 * y - 7) + 2 * (2 * x + y - 5);
    return [dx, dy];
  },

  hessian: () => {
    // Constant Hessian for quadratic function
    return [
      [10, 8],
      [8, 10],
    ];
  },
};
