import type { ObjectiveFunction } from './types.ts';

/**
 * Bukin function N.6
 * f(x, y) = 100√|y - 0.01x²| + 0.01|x + 10|
 *
 * Global minimum: (-10, 1) with f = 0
 * Has a narrow valley, making it difficult for optimization
 */
export const bukin6: ObjectiveFunction = {
  id: 'bukin6',
  name: 'Bukin N.6',
  description: 'f(x,y) = 100√|y-0.01x²| + 0.01|x+10|',
  dimension: 2,
  minima: [[-10, 1]],
  bounds: [-15, -5, -3, 3],
  defaultStart: [-12, 2],

  value: ([x, y]) => {
    return 100 * Math.sqrt(Math.abs(y - 0.01 * x * x)) + 0.01 * Math.abs(x + 10);
  },

  gradient: ([x, y]) => {
    const inner = y - 0.01 * x * x;
    const absInner = Math.abs(inner);
    const sqrtAbs = Math.sqrt(absInner);

    // Avoid division by zero
    const eps = 1e-10;
    const signInner = inner >= 0 ? 1 : -1;
    const signX10 = x + 10 >= 0 ? 1 : -1;

    // d/dx of 100√|y - 0.01x²|
    // = 100 * sign(inner) * (-0.02x) / (2√|inner|)
    // = -x * sign(inner) / √|inner|
    const dx = sqrtAbs > eps ? -x * signInner / sqrtAbs : 0;
    const dxTotal = dx + 0.01 * signX10;

    // d/dy of 100√|y - 0.01x²|
    // = 100 * sign(inner) / (2√|inner|)
    // = 50 * sign(inner) / √|inner|
    const dy = sqrtAbs > eps ? 50 * signInner / sqrtAbs : 0;

    return [dxTotal, dy];
  },

  hessian: ([x, y]) => {
    // Numerical approximation due to non-smooth nature
    const h = 1e-5;
    const grad = bukin6.gradient!;
    const g00 = grad([x, y]);
    const gx = grad([x + h, y]);
    const gy = grad([x, y + h]);

    return [
      [(gx[0] - g00[0]) / h, (gy[0] - g00[0]) / h],
      [(gx[1] - g00[1]) / h, (gy[1] - g00[1]) / h],
    ];
  },
};
