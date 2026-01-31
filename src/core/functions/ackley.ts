import type { ObjectiveFunction } from './types.ts';

/**
 * Ackley function
 * f(x, y) = -20exp(-0.2√(0.5(x² + y²))) - exp(0.5(cos(2πx) + cos(2πy))) + e + 20
 *
 * Global minimum: (0, 0) with f = 0
 * Nearly flat outer region with a large hole at the center
 */
export const ackley: ObjectiveFunction = {
  id: 'ackley',
  name: 'Ackley',
  description: 'f(x,y) = -20exp(-0.2√(0.5(x²+y²))) - exp(0.5(cos2πx+cos2πy)) + e + 20',
  dimension: 2,
  minima: [[0, 0]],
  bounds: [-5, 5, -5, 5],
  defaultStart: [3, 3],

  value: ([x, y]) => {
    const a = 20;
    const b = 0.2;
    const c = 2 * Math.PI;
    const sum1 = x * x + y * y;
    const sum2 = Math.cos(c * x) + Math.cos(c * y);
    return (
      -a * Math.exp(-b * Math.sqrt(0.5 * sum1)) -
      Math.exp(0.5 * sum2) +
      a +
      Math.E
    );
  },

  gradient: ([x, y]) => {
    const a = 20;
    const b = 0.2;
    const c = 2 * Math.PI;
    const sum1 = x * x + y * y;
    const sqrtTerm = Math.sqrt(0.5 * sum1);
    const expTerm1 = Math.exp(-b * sqrtTerm);
    const expTerm2 = Math.exp(0.5 * (Math.cos(c * x) + Math.cos(c * y)));

    // Handle the case when x = y = 0
    if (sqrtTerm < 1e-10) {
      return [0, 0];
    }

    const dx =
      a * b * expTerm1 * (0.5 * x) / sqrtTerm +
      0.5 * c * Math.sin(c * x) * expTerm2;
    const dy =
      a * b * expTerm1 * (0.5 * y) / sqrtTerm +
      0.5 * c * Math.sin(c * y) * expTerm2;

    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const a = 20;
    const b = 0.2;
    const c = 2 * Math.PI;
    const sum1 = x * x + y * y;
    const sqrtTerm = Math.sqrt(0.5 * sum1);

    // Handle near-zero case with approximation
    if (sqrtTerm < 1e-10) {
      return [
        [a * b * b * 0.5 + 0.5 * c * c, 0],
        [0, a * b * b * 0.5 + 0.5 * c * c],
      ];
    }

    const expTerm1 = Math.exp(-b * sqrtTerm);
    const expTerm2 = Math.exp(0.5 * (Math.cos(c * x) + Math.cos(c * y)));

    // Simplified approximation of Hessian diagonal
    const h11 =
      a * b * expTerm1 * (0.5 / sqrtTerm - 0.25 * b * x * x / (sum1 * sqrtTerm)) +
      0.5 * c * c * Math.cos(c * x) * expTerm2 +
      0.25 * c * c * Math.sin(c * x) * Math.sin(c * x) * expTerm2;
    const h22 =
      a * b * expTerm1 * (0.5 / sqrtTerm - 0.25 * b * y * y / (sum1 * sqrtTerm)) +
      0.5 * c * c * Math.cos(c * y) * expTerm2 +
      0.25 * c * c * Math.sin(c * y) * Math.sin(c * y) * expTerm2;
    const h12 =
      -a * b * expTerm1 * 0.25 * b * x * y / (sum1 * sqrtTerm) +
      0.25 * c * c * Math.sin(c * x) * Math.sin(c * y) * expTerm2;

    return [
      [h11, h12],
      [h12, h22],
    ];
  },
};
