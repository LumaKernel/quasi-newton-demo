import type { ObjectiveFunction } from './types.ts';

/**
 * McCormick function
 * f(x, y) = sin(x + y) + (x - y)² - 1.5x + 2.5y + 1
 *
 * Global minimum: (-0.54719, -1.54719) with f ≈ -1.9133
 */
export const mccormick: ObjectiveFunction = {
  id: 'mccormick',
  name: 'McCormick',
  description: 'f(x,y) = sin(x+y) + (x-y)² - 1.5x + 2.5y + 1',
  dimension: 2,
  minima: [[-0.54719, -1.54719]],
  bounds: [-1.5, 4, -3, 4],
  defaultStart: [0, 0],

  value: ([x, y]) => {
    return Math.sin(x + y) + (x - y) ** 2 - 1.5 * x + 2.5 * y + 1;
  },

  gradient: ([x, y]) => {
    const cosXY = Math.cos(x + y);
    const dx = cosXY + 2 * (x - y) - 1.5;
    const dy = cosXY - 2 * (x - y) + 2.5;
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const sinXY = -Math.sin(x + y);
    return [
      [sinXY + 2, sinXY - 2],
      [sinXY - 2, sinXY + 2],
    ];
  },
};
