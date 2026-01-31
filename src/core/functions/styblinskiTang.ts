import type { ObjectiveFunction } from './types.ts';

/**
 * Styblinski-Tang function
 * f(x, y) = 0.5 * [(x⁴ - 16x² + 5x) + (y⁴ - 16y² + 5y)]
 *
 * Global minimum: (-2.903534, -2.903534) with f ≈ -78.332
 * Multiple local minima
 */
export const styblinskiTang: ObjectiveFunction = {
  id: 'styblinskiTang',
  name: 'Styblinski-Tang',
  description: 'f(x,y) = 0.5[(x⁴-16x²+5x) + (y⁴-16y²+5y)]',
  dimension: 2,
  minima: [[-2.903534, -2.903534]],
  bounds: [-5, 5, -5, 5],
  defaultStart: [3, 3],

  value: ([x, y]) => {
    const termX = x * x * x * x - 16 * x * x + 5 * x;
    const termY = y * y * y * y - 16 * y * y + 5 * y;
    return 0.5 * (termX + termY);
  },

  gradient: ([x, y]) => {
    const dx = 0.5 * (4 * x * x * x - 32 * x + 5);
    const dy = 0.5 * (4 * y * y * y - 32 * y + 5);
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const h11 = 0.5 * (12 * x * x - 32);
    const h22 = 0.5 * (12 * y * y - 32);
    return [
      [h11, 0],
      [0, h22],
    ];
  },
};
