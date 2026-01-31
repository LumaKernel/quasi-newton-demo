import type { ObjectiveFunction } from './types.ts';

/**
 * Beale's function
 * f(x, y) = (1.5 - x + xy)² + (2.25 - x + xy²)² + (2.625 - x + xy³)²
 *
 * Global minimum: f(3, 0.5) = 0
 *
 * This function has a flat valley that makes it challenging for gradient-based methods.
 */
export const beale: ObjectiveFunction = {
  id: 'beale',
  name: 'Beale',
  description: 'f(x,y) = (1.5 - x + xy)² + (2.25 - x + xy²)² + (2.625 - x + xy³)²',
  dimension: 2,
  minima: [[3, 0.5]],
  bounds: [-4.5, 4.5, -4.5, 4.5],
  defaultStart: [0, 0],

  value: ([x, y]) => {
    const t1 = 1.5 - x + x * y;
    const t2 = 2.25 - x + x * y * y;
    const t3 = 2.625 - x + x * y * y * y;
    return t1 * t1 + t2 * t2 + t3 * t3;
  },

  gradient: ([x, y]) => {
    const t1 = 1.5 - x + x * y;
    const t2 = 2.25 - x + x * y * y;
    const t3 = 2.625 - x + x * y * y * y;

    const y2 = y * y;
    const y3 = y2 * y;

    const dx = 2 * t1 * (y - 1) + 2 * t2 * (y2 - 1) + 2 * t3 * (y3 - 1);
    const dy = 2 * t1 * x + 2 * t2 * 2 * x * y + 2 * t3 * 3 * x * y2;
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const y2 = y * y;
    const y3 = y2 * y;

    const t1 = 1.5 - x + x * y;
    const t2 = 2.25 - x + x * y2;
    const t3 = 2.625 - x + x * y3;

    // d²f/dx²
    const h11 = 2 * (y - 1) * (y - 1) + 2 * (y2 - 1) * (y2 - 1) + 2 * (y3 - 1) * (y3 - 1);

    // d²f/dxdy
    const h12 =
      2 * (y - 1) + 2 * t1 +
      2 * (y2 - 1) * 2 * y + 2 * t2 * 2 * y +
      2 * (y3 - 1) * 3 * y2 + 2 * t3 * 3 * y2;

    // d²f/dy²
    const h22 =
      2 * x * x +
      2 * 2 * x * (2 * x * y) + 2 * t2 * 2 * x +
      2 * 3 * x * y2 * 3 * x * y2 + 2 * t3 * 6 * x * y;

    return [
      [h11, h12],
      [h12, h22],
    ];
  },
};
