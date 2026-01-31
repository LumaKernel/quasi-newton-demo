import type { ObjectiveFunction } from './types.ts';

/**
 * Zakharov function
 * f(x,y) = x² + y² + (0.5x + y)² + (0.5x + y)⁴
 *
 * Bowl-shaped with polynomial terms.
 * Global minimum: f(0, 0) = 0
 */
export const zakharov: ObjectiveFunction = {
  id: 'zakharov',
  name: 'Zakharov',
  description: 'f(x,y) = x² + y² + (0.5x + y)² + (0.5x + y)⁴',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-5, 5, -5, 5],
  defaultStart: [3, 3],

  value: ([x, y]) => {
    const sum1 = x * x + y * y;
    const sum2 = 0.5 * x + y; // i * x_i sum where i=1,2
    return sum1 + sum2 * sum2 + sum2 * sum2 * sum2 * sum2;
  },

  gradient: ([x, y]) => {
    const s = 0.5 * x + y;
    const s2 = s * s;
    const s3 = s2 * s;
    // d/dx: 2x + 0.5 * 2s + 0.5 * 4s³
    const dx = 2 * x + s + 2 * s3;
    // d/dy: 2y + 2s + 4s³
    const dy = 2 * y + 2 * s + 4 * s3;
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const s = 0.5 * x + y;
    const s2 = s * s;
    // d²/dx²: 2 + 0.5 * 0.5 + 0.5 * 0.5 * 12s²
    const dxx = 2 + 0.25 + 3 * s2;
    // d²/dxdy: 0.5 + 0.5 * 12s² = 0.5 + 6s²
    const dxy = 0.5 + 6 * s2;
    // d²/dy²: 2 + 2 + 12s²
    const dyy = 2 + 2 + 12 * s2;
    return [
      [dxx, dxy],
      [dxy, dyy],
    ];
  },
};
