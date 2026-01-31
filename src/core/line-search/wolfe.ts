import type { Vector } from '../linalg/types.ts';
import { add, scale, dot } from '../linalg/vector.ts';
import type { LineSearchParams, LineSearchResult } from './types.ts';
import { defaultLineSearchParams } from './types.ts';

/**
 * Line search satisfying strong Wolfe conditions
 *
 * Finds a step size alpha that satisfies:
 * 1. Armijo: f(x + alpha * d) <= f(x) + c1 * alpha * grad(x)^T * d
 * 2. Curvature: |grad(x + alpha * d)^T * d| <= c2 * |grad(x)^T * d|
 *
 * Uses bracket and zoom approach for finding satisfying point.
 */
export const wolfeLineSearch = (
  f: (x: Vector) => number,
  grad: (x: Vector) => Vector,
  x: Vector,
  direction: Vector,
  params: Partial<LineSearchParams> = {},
): LineSearchResult => {
  const { c1, c2, maxIterations, initialAlpha } = {
    ...defaultLineSearchParams,
    ...params,
  };

  const fx = f(x);
  const gx = grad(x);
  const dg0 = dot(gx, direction);

  if (dg0 >= 0) {
    return { alpha: 0, evaluations: 1, success: false };
  }

  let evaluations = 1;
  let alphaLo = 0;
  let alphaHi = initialAlpha * 2;
  let alpha = initialAlpha;

  let fLo = fx;

  for (let i = 0; i < maxIterations; i++) {
    const xNew = add(x, scale(direction, alpha));
    const fNew = f(xNew);
    evaluations++;

    // Check Armijo condition
    if (fNew > fx + c1 * alpha * dg0 || (i > 0 && fNew >= fLo)) {
      alphaHi = alpha;
    } else {
      const gNew = grad(xNew);
      evaluations++;
      const dgNew = dot(gNew, direction);

      // Check strong Wolfe curvature condition
      if (Math.abs(dgNew) <= -c2 * dg0) {
        return { alpha, evaluations, success: true };
      }

      if (dgNew >= 0) {
        alphaHi = alpha;
      } else {
        alphaLo = alpha;
        fLo = fNew;
      }
    }

    // Bisection
    if (alphaHi === Infinity) {
      alpha = alpha * 2;
    } else {
      alpha = (alphaLo + alphaHi) / 2;
    }

    // Check for convergence
    if (Math.abs(alphaHi - alphaLo) < 1e-12) {
      return { alpha, evaluations, success: true };
    }
  }

  return { alpha, evaluations, success: false };
};
