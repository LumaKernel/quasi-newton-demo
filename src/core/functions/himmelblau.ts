import type { ObjectiveFunction } from './types.ts';

/**
 * Himmelblau's function
 * f(x, y) = (x^2 + y - 11)^2 + (x + y^2 - 7)^2
 *
 * This function has four identical local minima:
 * f(3.0, 2.0) = 0
 * f(-2.805118, 3.131312) = 0
 * f(-3.779310, -3.283186) = 0
 * f(3.584428, -1.848126) = 0
 *
 * Useful for testing algorithms' behavior with multiple minima.
 */
export const himmelblau: ObjectiveFunction = {
  id: 'himmelblau',
  name: 'Himmelblau',
  description: 'f(x,y) = (x² + y - 11)² + (x + y² - 7)²',
  dimension: 2,
  minima: [
    [3.0, 2.0],
    [-2.805118, 3.131312],
    [-3.77931, -3.283186],
    [3.584428, -1.848126],
  ],
  bounds: [-5, 5, -5, 5],
  defaultStart: [0, 0],

  value: ([x, y]) => {
    const term1 = x * x + y - 11;
    const term2 = x + y * y - 7;
    return term1 * term1 + term2 * term2;
  },

  gradient: ([x, y]) => {
    const u = x * x + y - 11;
    const v = x + y * y - 7;
    const dx = 4 * x * u + 2 * v;
    const dy = 2 * u + 4 * y * v;
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const h11 = 12 * x * x + 4 * y - 42;
    const h12 = 4 * x + 4 * y;
    const h21 = 4 * x + 4 * y;
    const h22 = 4 * x + 12 * y * y - 26;
    // Simplified: using direct derivation
    // d²f/dx² = 4*(3x² + y - 11) + 2 = 12x² + 4y - 42
    // d²f/dxdy = 4x + 4y
    // d²f/dy² = 2 + 4*(x + 3y² - 7) = 4x + 12y² - 26
    return [
      [h11, h12],
      [h21, h22],
    ];
  },
};
