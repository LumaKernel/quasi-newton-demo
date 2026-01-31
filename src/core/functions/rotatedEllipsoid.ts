import type { ObjectiveFunction } from './types.ts';

/**
 * Rotated Hyper-Ellipsoid function
 * f(x,y) = x² + (x + y)²
 *
 * An ellipsoid rotated 45 degrees, creating correlation between variables.
 * Good for testing quasi-Newton methods with correlated dimensions.
 * Global minimum: f(0, 0) = 0
 */
export const rotatedEllipsoid: ObjectiveFunction = {
  id: 'rotatedEllipsoid',
  name: 'Rotated Ellipsoid',
  description: 'f(x,y) = x² + (x + y)²',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-3, 3, -3, 3],
  defaultStart: [2, 2],

  value: ([x, y]) => {
    return x * x + (x + y) * (x + y);
  },

  gradient: ([x, y]) => {
    const dx = 2 * x + 2 * (x + y);
    const dy = 2 * (x + y);
    return [dx, dy];
  },

  hessian: () => [
    [4, 2],
    [2, 2],
  ],
};
