import type { ObjectiveFunction } from './types.ts';

/**
 * Dixon-Price function
 * f(x,y) = (x - 1)² + 2(2y² - x)²
 *
 * Has a valley-like structure.
 * Global minimum: f(1, 1/√2) = 0
 */
export const dixonPrice: ObjectiveFunction = {
  id: 'dixonPrice',
  name: 'Dixon-Price',
  description: 'f(x,y) = (x - 1)² + 2(2y² - x)²',
  dimension: 2,
  minima: [[1, Math.SQRT1_2]], // 1/√2 ≈ 0.707
  bounds: [-3, 3, -3, 3],
  defaultStart: [-2, 2],

  value: ([x, y]) => {
    const term1 = (x - 1) * (x - 1);
    const term2 = 2 * y * y - x;
    return term1 + 2 * term2 * term2;
  },

  gradient: ([x, y]) => {
    const t = 2 * y * y - x;
    const dx = 2 * (x - 1) - 4 * t;
    const dy = 16 * y * t;
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const t = 2 * y * y - x;
    const dxx = 2 + 4;
    const dxy = -16 * y;
    const dyy = 16 * t + 64 * y * y;
    return [
      [dxx, dxy],
      [dxy, dyy],
    ];
  },
};
