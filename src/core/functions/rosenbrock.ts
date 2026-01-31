import type { ObjectiveFunction } from './types.ts';

/**
 * Rosenbrock function (banana function)
 * f(x, y) = (a - x)^2 + b * (y - x^2)^2
 *
 * Default parameters: a = 1, b = 100
 * Global minimum: (a, a^2) = (1, 1) with f = 0
 *
 * This is a classic test function for optimization algorithms.
 * The global minimum lies inside a long, narrow, parabolic-shaped flat valley.
 */
export const createRosenbrock = (a = 1, b = 100): ObjectiveFunction => ({
  id: 'rosenbrock',
  name: 'Rosenbrock',
  description: `f(x,y) = (${a} - x)² + ${b}(y - x²)²`,
  dimension: 2,
  minima: [[a, a * a]],
  bounds: [-2, 2, -1, 3],
  defaultStart: [-1, 1],

  value: ([x, y]) => {
    const term1 = a - x;
    const term2 = y - x * x;
    return term1 * term1 + b * term2 * term2;
  },

  gradient: ([x, y]) => {
    const dx = -2 * (a - x) - 4 * b * x * (y - x * x);
    const dy = 2 * b * (y - x * x);
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const h11 = 2 - 4 * b * (y - 3 * x * x);
    const h12 = -4 * b * x;
    const h21 = -4 * b * x;
    const h22 = 2 * b;
    return [
      [h11, h12],
      [h21, h22],
    ];
  },
});

export const rosenbrock = createRosenbrock();
