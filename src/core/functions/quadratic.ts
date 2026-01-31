import type { ObjectiveFunction } from './types.ts';
import type { Matrix } from '../linalg/types.ts';

/**
 * Quadratic function
 * f(x) = 0.5 * x^T * A * x + b^T * x + c
 *
 * For a 2D case:
 * f(x, y) = 0.5 * (a11*x² + 2*a12*x*y + a22*y²) + b1*x + b2*y + c
 *
 * The Hessian is constant and equals A.
 * Useful for understanding convergence behavior on convex quadratics.
 */
export const createQuadratic = (
  a: Matrix = [
    [4, 1],
    [1, 2],
  ],
  b: readonly number[] = [0, 0],
  c = 0,
  id = 'quadratic',
): ObjectiveFunction => {
  const [[a11, a12], [a21, a22]] = a;

  // Solve for minimum: Ax* = -b
  const det = a11 * a22 - a12 * a21;
  const minX = det !== 0 ? [(-a22 * b[0] + a12 * b[1]) / det, (a21 * b[0] - a11 * b[1]) / det] : [0, 0];

  return {
    id,
    name: 'Quadratic',
    description: `f(x,y) = ½(${a11}x² + ${a12 + a21}xy + ${a22}y²) + ${b[0]}x + ${b[1]}y`,
    dimension: 2,
    minima: [minX],
    bounds: [-3, 3, -3, 3],
    defaultStart: [2, 2],

    value: ([x, y]) => {
      const quadTerm = 0.5 * (a11 * x * x + (a12 + a21) * x * y + a22 * y * y);
      const linTerm = b[0] * x + b[1] * y;
      return quadTerm + linTerm + c;
    },

    gradient: ([x, y]) => {
      const dx = a11 * x + a12 * y + b[0];
      const dy = a21 * x + a22 * y + b[1];
      return [dx, dy];
    },

    hessian: () => a,
  };
};

export const quadratic = createQuadratic();

/**
 * Ill-conditioned quadratic with high condition number
 * Good for demonstrating the advantage of quasi-Newton methods
 */
export const illConditionedQuadratic = createQuadratic(
  [
    [100, 0],
    [0, 1],
  ],
  [0, 0],
  0,
  'illConditionedQuadratic',
);
