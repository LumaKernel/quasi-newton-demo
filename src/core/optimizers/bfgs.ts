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
 * BFGS update for inverse Hessian approximation
 *
 * H_{k+1} = (I - rho * s * y^T) * H_k * (I - rho * y * s^T) + rho * s * s^T
 *
 * where:
 * - s = x_{k+1} - x_k
 * - y = g_{k+1} - g_k
 * - rho = 1 / (y^T * s)
 */
export const bfgsUpdate = (
  H: Matrix,
  s: Vector,
  y: Vector,
): Matrix => {
  const rho = 1 / dot(y, s);

  // Skip update if curvature condition is not satisfied
  if (!isFinite(rho) || rho <= 0) {
    return H;
  }

  const n = s.length;
  const I = identity(n);

  // Compute (I - rho * s * y^T)
  const syT = outer(s, y);
  const leftTerm = matAdd(I, matScale(syT, -rho));

  // Compute (I - rho * y * s^T)
  const ysT = outer(y, s);
  const rightTerm = matAdd(I, matScale(ysT, -rho));

  // Compute H_k * rightTerm
  const HRight: Matrix = H.map((row) =>
    rightTerm[0].map((_, j) =>
      row.reduce((sum, v, k) => sum + v * rightTerm[k][j], 0),
    ),
  );

  // Compute leftTerm * HRight
  const leftHRight: Matrix = leftTerm.map((row) =>
    HRight[0].map((_, j) =>
      row.reduce((sum, v, k) => sum + v * HRight[k][j], 0),
    ),
  );

  // Add rho * s * s^T
  const ssT = outer(s, s);
  return matAdd(leftHRight, matScale(ssT, rho));
};

/**
 * BFGS (Broyden-Fletcher-Goldfarb-Shanno) algorithm
 *
 * A quasi-Newton method that builds an approximation to the inverse Hessian
 * using gradient information. It has superlinear convergence and doesn't
 * require computing the true Hessian.
 */
export const bfgsOptimize = (
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

    // Compute s and y for BFGS update
    const s = sub(xNew, x);
    const y = sub(gNew, g);

    // Update inverse Hessian approximation
    H = bfgsUpdate(H, s, y);

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

export const bfgs: OptimizerInfo = {
  id: 'bfgs',
  name: 'BFGS',
  description: 'Broyden-Fletcher-Goldfarb-Shanno quasi-Newton method',
  usesTrueHessian: false,
  optimize: bfgsOptimize,
};
