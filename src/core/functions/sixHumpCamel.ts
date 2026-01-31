import type { ObjectiveFunction } from './types.ts';

/**
 * Six-Hump Camel function
 * f(x, y) = (4 - 2.1x² + x⁴/3)x² + xy + (-4 + 4y²)y²
 *
 * Has 6 local minima, 2 of which are global
 * Global minima: (0.0898, -0.7126) and (-0.0898, 0.7126) with f ≈ -1.0316
 */
export const sixHumpCamel: ObjectiveFunction = {
  id: 'sixHumpCamel',
  name: 'Six-Hump Camel',
  description: 'f(x,y) = (4-2.1x²+x⁴/3)x² + xy + (-4+4y²)y²',
  dimension: 2,
  minima: [
    [0.0898, -0.7126],
    [-0.0898, 0.7126],
  ],
  bounds: [-3, 3, -2, 2],
  defaultStart: [-1, 1],

  value: ([x, y]) => {
    const x2 = x * x;
    const y2 = y * y;
    return (4 - 2.1 * x2 + (x2 * x2) / 3) * x2 + x * y + (-4 + 4 * y2) * y2;
  },

  gradient: ([x, y]) => {
    const x2 = x * x;
    const y2 = y * y;
    // df/dx = 8x - 8.4x³ + 2x⁵ + y
    const dx = 8 * x - 8.4 * x * x2 + 2 * x * x2 * x2 + y;
    // df/dy = x - 8y + 16y³
    const dy = x - 8 * y + 16 * y * y2;
    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const x2 = x * x;
    const y2 = y * y;
    // d²f/dx² = 8 - 25.2x² + 10x⁴
    const dxx = 8 - 25.2 * x2 + 10 * x2 * x2;
    // d²f/dxdy = 1
    const dxy = 1;
    // d²f/dy² = -8 + 48y²
    const dyy = -8 + 48 * y2;
    return [
      [dxx, dxy],
      [dxy, dyy],
    ];
  },
};
