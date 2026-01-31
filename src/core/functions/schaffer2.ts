import type { ObjectiveFunction } from './types.ts';

/**
 * Schaffer function N.2
 * f(x, y) = 0.5 + (sin²(x² - y²) - 0.5) / (1 + 0.001(x² + y²))²
 *
 * Global minimum: (0, 0) with f = 0
 */
export const schaffer2: ObjectiveFunction = {
  id: 'schaffer2',
  name: 'Schaffer N.2',
  description: 'f(x,y) = 0.5 + (sin²(x²-y²)-0.5)/(1+0.001(x²+y²))²',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-100, 100, -100, 100],
  defaultStart: [10, 10],

  value: ([x, y]) => {
    const x2 = x * x;
    const y2 = y * y;
    const sinTerm = Math.sin(x2 - y2);
    const denom = 1 + 0.001 * (x2 + y2);
    return 0.5 + (sinTerm * sinTerm - 0.5) / (denom * denom);
  },

  gradient: ([x, y]) => {
    const x2 = x * x;
    const y2 = y * y;
    const diff = x2 - y2;
    const sum = x2 + y2;
    const sinDiff = Math.sin(diff);
    const cosDiff = Math.cos(diff);
    const denom = 1 + 0.001 * sum;
    const denom2 = denom * denom;
    const denom3 = denom2 * denom;

    // Numerator: sin²(x² - y²) - 0.5
    const numer = sinDiff * sinDiff - 0.5;

    // d/dx of sin²(x² - y²) = 2 sin(x² - y²) cos(x² - y²) * 2x = 4x sin(x² - y²) cos(x² - y²)
    const dNumerDx = 4 * x * sinDiff * cosDiff;
    const dNumerDy = -4 * y * sinDiff * cosDiff;

    // Quotient rule: d/dx (N/D²) = (N' * D² - N * 2D * D') / D⁴ = (N' * D - 2N * D') / D³
    // where D' w.r.t. x = 0.002x
    const dx = (dNumerDx * denom - 2 * numer * 0.002 * x) / denom3;
    const dy = (dNumerDy * denom - 2 * numer * 0.002 * y) / denom3;

    return [dx, dy];
  },

  hessian: ([x, y]) => {
    // Numerical approximation for simplicity
    const h = 1e-5;
    const grad = schaffer2.gradient!;
    const g00 = grad([x, y]);
    const gx = grad([x + h, y]);
    const gy = grad([x, y + h]);

    return [
      [(gx[0] - g00[0]) / h, (gy[0] - g00[0]) / h],
      [(gx[1] - g00[1]) / h, (gy[1] - g00[1]) / h],
    ];
  },
};
