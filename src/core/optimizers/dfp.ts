import type { ObjectiveFunction } from '../functions/types.ts';
import type { Vector, Matrix } from '../linalg/types.ts';
import { norm, add, scale, sub, dot, outer, matVec } from '../linalg/vector.ts';
import { identity, add as matAdd, scale as matScale } from '../linalg/matrix.ts';
import { wolfeLineSearch } from '../line-search/wolfe.ts';
import type {
  OptimizerParams,
  OptimizationResult,
  IterationState,
  OptimizerInfo,
} from './types.ts';
import { defaultOptimizerParams } from './types.ts';

/**
 * DFP update for inverse Hessian approximation
 *
 * H_{k+1} = H_k + (s * s^T) / (s^T * y) - (H_k * y * y^T * H_k) / (y^T * H_k * y)
 *
 * where:
 * - s = x_{k+1} - x_k
 * - y = g_{k+1} - g_k
 */
export const dfpUpdate = (
  H: Matrix,
  s: Vector,
  y: Vector,
): Matrix => {
  const sTy = dot(s, y);

  // Skip update if curvature condition is not satisfied
  if (Math.abs(sTy) < 1e-12) {
    return H;
  }

  // Compute H * y
  const Hy = matVec(H, y);

  // Compute y^T * H * y
  const yTHy = dot(y, Hy);

  if (Math.abs(yTHy) < 1e-12) {
    return H;
  }

  // First term: s * s^T / (s^T * y)
  const ssT = outer(s, s);
  const term1 = matScale(ssT, 1 / sTy);

  // Second term: (H * y) * (H * y)^T / (y^T * H * y)
  // Note: (H * y) * y^T * H = outer(Hy, Hy) since H is symmetric
  const HyyTH = outer(Hy, Hy);
  const term2 = matScale(HyyTH, 1 / yTHy);

  // H_{k+1} = H_k + term1 - term2
  return matAdd(matAdd(H, term1), matScale(term2, -1));
};

/**
 * DFP (Davidon-Fletcher-Powell) algorithm
 *
 * A quasi-Newton method that builds an approximation to the inverse Hessian.
 * DFP was the first quasi-Newton method but is generally considered less
 * robust than BFGS. However, it can be useful for comparison.
 */
export const dfpOptimize = (
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
    const direction = scale(matVec(H, g), -1);

    // Line search
    const { alpha, evaluations } = wolfeLineSearch(
      func.value,
      func.gradient,
      x,
      direction,
    );
    functionEvaluations += evaluations;
    gradientEvaluations += Math.floor(evaluations / 2);

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

    // Compute s and y for DFP update
    const s = sub(xNew, x);
    const y = sub(gNew, g);

    // Update inverse Hessian approximation
    H = dfpUpdate(H, s, y);

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

export const dfp: OptimizerInfo = {
  id: 'dfp',
  name: 'DFP',
  description: 'Davidon-Fletcher-Powell quasi-Newton method',
  usesTrueHessian: false,
  optimize: dfpOptimize,
};
