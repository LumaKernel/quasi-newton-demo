import type { ObjectiveFunction } from './types.ts';

/**
 * Drop-Wave function
 * f(x, y) = -(1 + cos(12√(x²+y²))) / (0.5(x²+y²) + 2)
 *
 * Global minimum: (0, 0) with f = -1
 * Has many local minima in a wave pattern
 */
export const dropWave: ObjectiveFunction = {
  id: 'dropWave',
  name: 'Drop-Wave',
  description: 'f(x,y) = -(1+cos(12√(x²+y²)))/(0.5(x²+y²)+2)',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-5.12, 5.12, -5.12, 5.12],
  defaultStart: [2, 2],

  value: ([x, y]) => {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const numer = 1 + Math.cos(12 * r);
    const denom = 0.5 * r2 + 2;
    return -numer / denom;
  },

  gradient: ([x, y]) => {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const eps = 1e-10;

    if (r < eps) {
      return [0, 0];
    }

    const cosR = Math.cos(12 * r);
    const sinR = Math.sin(12 * r);
    const numer = 1 + cosR;
    const denom = 0.5 * r2 + 2;

    // d/dx of -(1 + cos(12r)) / (0.5r² + 2)
    // Using quotient rule and chain rule
    // dr/dx = x/r
    const drDx = x / r;
    const drDy = y / r;

    // d(numer)/dr = -12 sin(12r)
    const dNumerDr = -12 * sinR;

    // d(denom)/dr = r
    const dDenomDr = r;

    // d/dr of -numer/denom = -(dNumer * denom - numer * dDenom) / denom²
    const dFdR = -(dNumerDr * denom - numer * dDenomDr) / (denom * denom);

    return [dFdR * drDx, dFdR * drDy];
  },

  hessian: ([x, y]) => {
    const h = 1e-5;
    const grad = dropWave.gradient!;
    const g00 = grad([x, y]);
    const gx = grad([x + h, y]);
    const gy = grad([x, y + h]);

    return [
      [(gx[0] - g00[0]) / h, (gy[0] - g00[0]) / h],
      [(gx[1] - g00[1]) / h, (gy[1] - g00[1]) / h],
    ];
  },
};
