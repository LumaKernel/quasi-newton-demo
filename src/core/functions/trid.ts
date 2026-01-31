import type { ObjectiveFunction } from './types.ts';

/**
 * Trid function
 * f(x,y) = (x-1)² + (y-1)² - xy
 *
 * Has a unique global minimum in a valley-like structure.
 * Minimum: f(2, 2) = -2 (for 2D case)
 */
export const trid: ObjectiveFunction = {
  id: 'trid',
  name: 'Trid',
  description: 'f(x,y) = (x-1)² + (y-1)² - xy',
  dimension: 2,
  minima: [[2, 2]],
  bounds: [-4, 6, -4, 6],
  defaultStart: [-2, -2],

  value: ([x, y]) => {
    return (x - 1) * (x - 1) + (y - 1) * (y - 1) - x * y;
  },

  gradient: ([x, y]) => {
    const dx = 2 * (x - 1) - y;
    const dy = 2 * (y - 1) - x;
    return [dx, dy];
  },

  hessian: () => [
    [2, -1],
    [-1, 2],
  ],
};
