import type { ObjectiveFunction } from '../functions/types.ts';
import type { Vector } from '../linalg/types.ts';
import type {
  OptimizerParams,
  OptimizationResult,
  IterationState,
  OptimizerInfo,
} from './types.ts';
import { defaultOptimizerParams } from './types.ts';
import { backtracking } from '../line-search/backtracking.ts';
import { norm, add, scale } from '../linalg/vector.ts';
import { identity } from '../linalg/matrix.ts';

/**
 * Gradient Descent (Steepest Descent) optimizer
 *
 * The simplest optimization method using only first-order gradient information.
 * Update rule: x_{k+1} = x_k - α_k * ∇f(x_k)
 *
 * Where α_k is the step size determined by line search.
 */
export const gradientDescent = (
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

  for (let iter = 0; iter <= maxIterations; iter++) {
    const fx = func.value(x);
    const trueH = func.hessian(x);
    functionEvaluations++;

    const gradNorm = norm(g);

    // Store iteration state
    // For gradient descent, hessianApprox is just identity (no Hessian approximation)
    const state: IterationState = {
      x,
      fx,
      gradient: g,
      gradientNorm: gradNorm,
      direction: null,
      alpha: null,
      hessianApprox: identity(x.length),
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

    // Search direction: negative gradient (steepest descent)
    const direction = scale(g, -1);

    // Line search to find step size
    const { alpha, evaluations } = backtracking(
      func.value,
      func.gradient,
      x,
      direction,
      { initialAlpha: 1.0 },
    );
    functionEvaluations += evaluations;

    // Update iteration with direction and alpha
    iterations[iterations.length - 1] = {
      ...state,
      direction,
      alpha,
    };

    // Update position: x_{k+1} = x_k + α * d = x_k - α * ∇f
    const xNew = add(x, scale(direction, alpha));
    const gNew = func.gradient(xNew);
    gradientEvaluations++;

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

export const steepestDescent: OptimizerInfo = {
  id: 'steepestDescent',
  name: 'Gradient Descent',
  description: 'Steepest descent using negative gradient direction',
  usesTrueHessian: false,
  optimize: gradientDescent,
};
