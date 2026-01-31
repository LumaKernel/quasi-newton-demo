import type { ObjectiveFunction } from '../functions/types.ts';
import type { Vector } from '../linalg/types.ts';
import { norm, add, scale } from '../linalg/vector.ts';
import { inverse, identity } from '../linalg/matrix.ts';
import { backtracking } from '../line-search/backtracking.ts';
import type {
  OptimizerParams,
  OptimizationResult,
  IterationState,
  OptimizerInfo,
} from './types.ts';
import { defaultOptimizerParams } from './types.ts';

/**
 * Newton's method for optimization
 *
 * Uses the true Hessian matrix to compute the search direction:
 * d = -H^(-1) * g
 *
 * This provides quadratic convergence near the solution but requires
 * computing and inverting the Hessian at each step.
 */
export const newtonOptimize = (
  func: ObjectiveFunction,
  x0: Vector,
  params: Partial<OptimizerParams> = {},
): OptimizationResult => {
  const { maxIterations, tolerance } = { ...defaultOptimizerParams, ...params };

  const iterations: IterationState[] = [];
  let x = x0;
  let functionEvaluations = 0;
  let gradientEvaluations = 0;

  for (let iter = 0; iter <= maxIterations; iter++) {
    const fx = func.value(x);
    const g = func.gradient(x);
    const H = func.hessian(x);
    functionEvaluations++;
    gradientEvaluations++;

    const gradNorm = norm(g);
    const Hinv = inverse(H) ?? identity(x.length);

    // Store iteration state
    const state: IterationState = {
      x,
      fx,
      gradient: g,
      gradientNorm: gradNorm,
      direction: iter === 0 ? null : iterations[iter - 1].direction,
      alpha: iter === 0 ? null : iterations[iter - 1].alpha,
      hessianApprox: Hinv,
      trueHessian: H,
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

    // Compute Newton direction: d = -H^(-1) * g
    const direction = Hinv.map((row) =>
      -row.reduce((sum, v, j) => sum + v * g[j], 0),
    );

    // Line search to find step size
    const { alpha } = backtracking(
      func.value,
      func.gradient,
      x,
      direction,
      { initialAlpha: 1.0 },
    );
    functionEvaluations += 2; // Approximate additional evaluations

    // Update state with direction and alpha for next iteration
    iterations[iterations.length - 1] = {
      ...state,
      direction,
      alpha,
    };

    // Update x
    x = add(x, scale(direction, alpha));
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

export const newton: OptimizerInfo = {
  id: 'newton',
  name: "Newton's Method",
  description: 'Uses true Hessian matrix for quadratic convergence',
  usesTrueHessian: true,
  optimize: newtonOptimize,
};
