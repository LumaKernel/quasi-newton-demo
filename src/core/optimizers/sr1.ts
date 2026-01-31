import type { ObjectiveFunction } from '../functions/types.ts';
import type { Vector, Matrix } from '../linalg/types.ts';
import { norm, add, scale, sub, dot, outer, matVec } from '../linalg/vector.ts';
import { identity, add as matAdd, scale as matScale } from '../linalg/matrix.ts';
import { backtracking } from '../line-search/backtracking.ts';
import type {
  OptimizerParams,
  OptimizationResult,
  IterationState,
  OptimizerInfo,
} from './types.ts';
import { defaultOptimizerParams } from './types.ts';

/**
 * SR1 (Symmetric Rank-1) update for inverse Hessian approximation
 *
 * H_{k+1} = H_k + (s - H_k * y) * (s - H_k * y)^T / ((s - H_k * y)^T * y)
 *
 * where:
 * - s = x_{k+1} - x_k
 * - y = g_{k+1} - g_k
 *
 * SR1 update can approximate the Hessian exactly for quadratic functions
 * in n steps. However, it doesn't guarantee positive definiteness.
 */
export const sr1Update = (
  H: Matrix,
  s: Vector,
  y: Vector,
  skipThreshold = 1e-8,
): Matrix => {
  // Compute s - H * y
  const Hy = matVec(H, y);
  const sMinusHy = sub(s, Hy);

  // Compute denominator: (s - H * y)^T * y
  const denom = dot(sMinusHy, y);

  // Skip update if denominator is too small (safeguard)
  // This is the standard SR1 safeguard to avoid numerical issues
  const normSMinusHy = norm(sMinusHy);
  const normY = norm(y);

  if (Math.abs(denom) < skipThreshold * normSMinusHy * normY) {
    return H;
  }

  // SR1 update: H + (s - Hy)(s - Hy)^T / denom
  const update = outer(sMinusHy, sMinusHy);
  return matAdd(H, matScale(update, 1 / denom));
};

/**
 * SR1 (Symmetric Rank-1) algorithm
 *
 * A quasi-Newton method that uses a rank-1 update formula.
 * Unlike BFGS and DFP, SR1 can generate indefinite approximations,
 * which can be useful for non-convex problems but requires careful handling.
 *
 * Key properties:
 * - Can approximate the exact Hessian in n steps for quadratic functions
 * - Does not guarantee positive definiteness
 * - May skip updates to maintain stability
 */
export const sr1Optimize = (
  func: ObjectiveFunction,
  x0: Vector,
  params: Partial<OptimizerParams> = {},
): OptimizationResult => {
  const { maxIterations, tolerance, initialHessianApprox } = {
    ...defaultOptimizerParams,
    ...params,
  };

  const iterations: IterationState[] = [];
  let x = x0;
  let H = initialHessianApprox ?? identity(x0.length);
  let functionEvaluations = 0;
  let gradientEvaluations = 0;

  let g = func.gradient(x);
  gradientEvaluations++;

  for (let iter = 0; iter <= maxIterations; iter++) {
    const fx = func.value(x);
    const trueH = func.hessian(x);
    functionEvaluations++;

    const gradNorm = norm(g);

    // Store iteration state
    const state: IterationState = {
      x,
      fx,
      gradient: g,
      gradientNorm: gradNorm,
      direction: null,
      alpha: null,
      hessianApprox: H,
      trueHessian: trueH,
      iteration: iter,
    };
    iterations.push(state);

    // Check convergence
    if (gradNorm < tolerance) {
      return {
        iterations,
        solution: x,
        finalValue: fx,
        converged: true,
        functionEvaluations,
        gradientEvaluations,
      };
    }

    if (iter === maxIterations) break;

    // Compute search direction: d = -H * g
    let direction = scale(matVec(H, g), -1);

    // Check if direction is descent direction
    const dirDot = dot(direction, g);
    if (dirDot >= 0) {
      // Fall back to steepest descent
      direction = scale(g, -1);
    }

    // Line search (use backtracking since SR1 may not satisfy Wolfe conditions)
    const { alpha, evaluations } = backtracking(
      func.value,
      func.gradient,
      x,
      direction,
    );
    functionEvaluations += evaluations;

    // Update iteration with direction and alpha
    iterations[iterations.length - 1] = {
      ...state,
      direction,
      alpha,
    };

    // Compute new point
    const xNew = add(x, scale(direction, alpha));
    const gNew = func.gradient(xNew);
    gradientEvaluations++;

    // Compute s and y for SR1 update
    const s = sub(xNew, x);
    const y = sub(gNew, g);

    // Update inverse Hessian approximation
    H = sr1Update(H, s, y);

    // Move to next iteration
    x = xNew;
    g = gNew;
  }

  const finalFx = func.value(x);
  return {
    iterations,
    solution: x,
    finalValue: finalFx,
    converged: false,
    functionEvaluations,
    gradientEvaluations,
  };
};

export const sr1: OptimizerInfo = {
  id: 'sr1',
  name: 'SR1',
  description: 'Symmetric Rank-1 quasi-Newton method',
  usesTrueHessian: false,
  optimize: sr1Optimize,
};
