import type { ObjectiveFunction } from './types.ts';

/**
 * Three-hump camel function
 * f(x, y) = 2x² - 1.05x⁴ + x⁶/6 + xy + y²
 *
 * Global minimum: (0, 0) with f = 0
 * Has three local minima
 */
export const threeHumpCamel: ObjectiveFunction = {
  id: 'threeHumpCamel',
  name: 'Three-Hump Camel',
  description: 'f(x,y) = 2x² - 1.05x⁴ + x⁶/6 + xy + y²',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-5, 5, -5, 5],
  defaultStart: [2, -2],

  value: ([x, y]) => {
    const x2 = x * x;
    const x4 = x2 * x2;
    const x6 = x4 * x2;
    return 2 * x2 - 1.05 * x4 + x6 / 6 + x * y + y * y;
  },

  gradient: ([x, y]) => {
    const x2 = x * x;
    const x3 = x2 * x;
    const x5 = x3 * x2;
    const dx = 4 * x - 4.2 * x3 + x5 + y;
    const dy = x + 2 * y;
    return [dx, dy];
  },

  hessian: ([x]) => {
    const x2 = x * x;
    const x4 = x2 * x2;
    const h11 = 4 - 12.6 * x2 + 5 * x4;
    return [
      [h11, 1],
      [1, 2],
    ];
  },
};
