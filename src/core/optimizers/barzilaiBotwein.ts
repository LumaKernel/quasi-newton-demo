import type { ObjectiveFunction } from '../functions/types.ts';
import type { Vector } from '../linalg/types.ts';
import type {
  OptimizerParams,
  OptimizationResult,
  IterationState,
  OptimizerInfo,
} from './types.ts';
import { defaultOptimizerParams } from './types.ts';
import { norm, add, scale, sub, dot } from '../linalg/vector.ts';
import { identity, scale as matScale } from '../linalg/matrix.ts';

/**
 * Barzilai-Borwein (BB) Method
 *
 * The simplest quasi-Newton method that approximates the inverse Hessian
 * as a scalar multiple of the identity matrix: B_k = α_k I
 *
 * This is derived from the secant condition B_k y_{k-1} = s_{k-1}
 * by finding the scalar α that minimizes ||α y - s||²
 *
 * Two variants exist:
 * - BB1: α_k = (s^T s) / (s^T y) = ||s||² / (s^T y)
 * - BB2: α_k = (s^T y) / (y^T y) = (s^T y) / ||y||²
 *
 * This implementation uses BB1 by default.
 */
export const barzilaiBotweinOptimize = (
  func: ObjectiveFunction,
  x0: Vector,
  params: Partial<OptimizerParams> = {},
): OptimizationResult => {
  const { maxIterations, tolerance } = { ...defaultOptimizerParams, ...params };

  const iterations: IterationState[] = [];
  let x = x0;
  let functionEvaluations = 0;
  let gradientEvaluations = 0;

  let g = func.gradient(x);
  gradientEvaluations++;

  // Initial step size (will be updated using BB formula after first iteration)
  let alpha = 1.0;

  for (let iter = 0; iter <= maxIterations; iter++) {
    const fx = func.value(x);
    const trueH = func.hessian(x);
    functionEvaluations++;

    const gradNorm = norm(g);

    // B_k = α_k * I (scalar times identity)
    const Bk = matScale(identity(x.length), alpha);

    // Store iteration state
    const state: IterationState = {
      x,
      fx,
      gradient: g,
      gradientNorm: gradNorm,
      direction: null,
      alpha: null,
      hessianApprox: Bk,
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

    // Compute search direction: d = -B_k * g = -α_k * g
    const direction = scale(g, -alpha);

    // For BB method, we typically use α=1 in the line search
    // (the step size is already incorporated in the direction)
    // But we still do a safeguarded step
    const stepAlpha = 1.0;

    // Update iteration with direction and alpha
    iterations[iterations.length - 1] = {
      ...state,
      direction,
      alpha: stepAlpha,
    };

    // Compute new point
    const xNew = add(x, scale(direction, stepAlpha));
    const gNew = func.gradient(xNew);
    gradientEvaluations++;

    // Compute s and y for BB update
    const s = sub(xNew, x);
    const y = sub(gNew, g);

    // BB1 formula: α = (s^T s) / (s^T y)
    const sTy = dot(s, y);
    const sTs = dot(s, s);

    // Update alpha using BB1 formula (with safeguards)
    if (sTy > 1e-12) {
      alpha = sTs / sTy;
      // Safeguard: keep alpha in reasonable range
      alpha = Math.max(1e-10, Math.min(alpha, 1e10));
    }

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

export const barzilaiBotwein: OptimizerInfo = {
  id: 'bb',
  name: 'Barzilai-Borwein',
  description: 'Simplest quasi-Newton: scalar Hessian approximation B_k = α_k I',
  usesTrueHessian: false,
  optimize: barzilaiBotweinOptimize,
};
