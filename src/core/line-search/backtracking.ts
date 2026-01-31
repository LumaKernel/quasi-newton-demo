import type { Vector } from '../linalg/types.ts';
import { add, scale, dot } from '../linalg/vector.ts';
import type { LineSearchParams, LineSearchResult } from './types.ts';
import { defaultLineSearchParams } from './types.ts';

/**
 * Backtracking line search with Armijo condition
 *
 * Finds a step size alpha that satisfies:
 * f(x + alpha * d) <= f(x) + c1 * alpha * grad(x)^T * d
 *
 * Uses multiplicative decrease (tau = 0.5) when condition is not met.
 */
export const backtracking = (
  f: (x: Vector) => number,
  grad: (x: Vector) => Vector,
  x: Vector,
  direction: Vector,
  params: Partial<LineSearchParams> = {},
): LineSearchResult => {
  const { c1, maxIterations, initialAlpha } = {
    ...defaultLineSearchParams,
    ...params,
  };

  const tau = 0.5; // Step size reduction factor
  const fx = f(x);
  const gx = grad(x);
  const directionalDerivative = dot(gx, direction);

  // Check if direction is a descent direction
  if (directionalDerivative >= 0) {
    return { alpha: 0, evaluations: 1, success: false };
  }

  let alpha = initialAlpha;
  let evaluations = 1;

  for (let i = 0; i < maxIterations; i++) {
    const xNew = add(x, scale(direction, alpha));
    const fNew = f(xNew);
    evaluations++;

    // Armijo condition
    if (fNew <= fx + c1 * alpha * directionalDerivative) {
      return { alpha, evaluations, success: true };
    }

    alpha *= tau;
  }

  return { alpha, evaluations, success: false };
};
