import type { ObjectiveFunction } from './types.ts';

/**
 * Rastrigin function
 * f(x, y) = 20 + (x² - 10cos(2πx)) + (y² - 10cos(2πy))
 *
 * Global minimum: (0, 0) with f = 0
 * Highly multimodal with many local minima arranged in a regular lattice
 */
export const rastrigin: ObjectiveFunction = {
  id: 'rastrigin',
  name: 'Rastrigin',
  description: 'f(x,y) = 20 + x² - 10cos(2πx) + y² - 10cos(2πy)',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-5.12, 5.12, -5.12, 5.12],
  defaultStart: [3, 3],

  value: ([x, y]) => {
    const A = 10;
    const n = 2;
    return (
      A * n +
      (x * x - A * Math.cos(2 * Math.PI * x)) +
      (y * y - A * Math.cos(2 * Math.PI * y))
    );
  },

  gradient: ([x, y]) => {
    const A = 10;
    const dx = 2 * x + A * 2 * Math.PI * Math.sin(2 * Math.PI * x);
    const dy = 2 * y + A * 2 * Math.PI * Math.sin(2 * Math.PI * y);
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const A = 10;
    const h11 = 2 + A * 4 * Math.PI * Math.PI * Math.cos(2 * Math.PI * x);
    const h22 = 2 + A * 4 * Math.PI * Math.PI * Math.cos(2 * Math.PI * y);
    return [
      [h11, 0],
      [0, h22],
    ];
  },
};
