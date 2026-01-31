import type { ObjectiveFunction } from './types.ts';

/**
 * Goldstein-Price function
 * f(x,y) = [1 + (x+y+1)²(19-14x+3x²-14y+6xy+3y²)] × [30 + (2x-3y)²(18-32x+12x²+48y-36xy+27y²)]
 *
 * Global minimum: (0, -1) with f = 3
 * Bowl-shaped with multiple local minima
 */
export const goldsteinPrice: ObjectiveFunction = {
  id: 'goldsteinPrice',
  name: 'Goldstein-Price',
  description: 'f(x,y) = [1+(x+y+1)²(...)][30+(2x-3y)²(...)]',
  dimension: 2,
  minima: [[0, -1]],
  bounds: [-2, 2, -2, 2],
  defaultStart: [1.5, 0.5],

  value: ([x, y]) => {
    const a = x + y + 1;
    const b = 19 - 14 * x + 3 * x * x - 14 * y + 6 * x * y + 3 * y * y;
    const c = 2 * x - 3 * y;
    const d = 18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y * y;
    return (1 + a * a * b) * (30 + c * c * d);
  },

  gradient: ([x, y]) => {
    const a = x + y + 1;
    const b = 19 - 14 * x + 3 * x * x - 14 * y + 6 * x * y + 3 * y * y;
    const c = 2 * x - 3 * y;
    const d = 18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y * y;

    const da_dx = 1;
    const da_dy = 1;
    const db_dx = -14 + 6 * x + 6 * y;
    const db_dy = -14 + 6 * x + 6 * y;
    const dc_dx = 2;
    const dc_dy = -3;
    const dd_dx = -32 + 24 * x - 36 * y;
    const dd_dy = 48 - 36 * x + 54 * y;

    const term1 = 1 + a * a * b;
    const term2 = 30 + c * c * d;

    const dterm1_dx = 2 * a * da_dx * b + a * a * db_dx;
    const dterm1_dy = 2 * a * da_dy * b + a * a * db_dy;
    const dterm2_dx = 2 * c * dc_dx * d + c * c * dd_dx;
    const dterm2_dy = 2 * c * dc_dy * d + c * c * dd_dy;

    const dx = dterm1_dx * term2 + term1 * dterm2_dx;
    const dy = dterm1_dy * term2 + term1 * dterm2_dy;

    return [dx, dy];
  },

  hessian: ([x, y]) => {
    // Numerical approximation for simplicity due to complex derivatives
    const h = 1e-5;
    const grad = goldsteinPrice.gradient([x, y]);
    const gradPlusX = goldsteinPrice.gradient([x + h, y]);
    const gradPlusY = goldsteinPrice.gradient([x, y + h]);

    const h11 = (gradPlusX[0] - grad[0]) / h;
    const h12 = (gradPlusY[0] - grad[0]) / h;
    const h22 = (gradPlusY[1] - grad[1]) / h;

    return [
      [h11, h12],
      [h12, h22],
    ];
  },
};
