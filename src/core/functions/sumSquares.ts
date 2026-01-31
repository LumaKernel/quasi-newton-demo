import type { ObjectiveFunction } from './types.ts';

/**
 * Sum of Squares function (weighted sphere)
 * f(x,y) = x² + 2y²
 *
 * Like sphere but with different weights, creating an elliptical shape.
 * Global minimum: f(0, 0) = 0
 */
export const sumSquares: ObjectiveFunction = {
  id: 'sumSquares',
  name: 'Sum of Squares',
  description: 'f(x,y) = x² + 2y²',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-3, 3, -3, 3],
  defaultStart: [2, 2],

  value: ([x, y]) => {
    return x * x + 2 * y * y;
  },

  gradient: ([x, y]) => {
    return [2 * x, 4 * y];
  },

  hessian: () => [
    [2, 0],
    [0, 4],
  ],
};
