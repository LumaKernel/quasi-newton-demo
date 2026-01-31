import type { Vector, Matrix } from '../linalg/types.ts';
import type { ObjectiveFunction } from '../functions/types.ts';

/**
 * A single iteration state in the optimization process
 */
export interface IterationState {
  /** Current point */
  readonly x: Vector;
  /** Function value at current point */
  readonly fx: number;
  /** Gradient at current point */
  readonly gradient: Vector;
  /** Gradient norm */
  readonly gradientNorm: number;
  /** Search direction used (null for initial state) */
  readonly direction: Vector | null;
  /** Step size used (null for initial state) */
  readonly alpha: number | null;
  /** Approximate inverse Hessian (for quasi-Newton methods) or true inverse Hessian (for Newton) */
  readonly hessianApprox: Matrix;
  /** True Hessian matrix at current point (for comparison) */
  readonly trueHessian: Matrix;
  /** Iteration number */
  readonly iteration: number;
}

/**
 * Result of running an optimization algorithm
 */
export interface OptimizationResult {
  /** All iteration states (for visualization) */
  readonly iterations: readonly IterationState[];
  /** Final point */
  readonly solution: Vector;
  /** Final function value */
  readonly finalValue: number;
  /** Whether the optimization converged */
  readonly converged: boolean;
  /** Number of function evaluations */
  readonly functionEvaluations: number;
  /** Number of gradient evaluations */
  readonly gradientEvaluations: number;
}

/**
 * Parameters for optimization algorithms
 */
export interface OptimizerParams {
  /** Maximum number of iterations */
  readonly maxIterations: number;
  /** Gradient norm tolerance for convergence */
  readonly tolerance: number;
  /** Initial inverse Hessian approximation (identity by default) */
  readonly initialHessianApprox?: Matrix;
}

export const defaultOptimizerParams: OptimizerParams = {
  maxIterations: 100,
  tolerance: 1e-6,
};

/**
 * Optimizer function type
 */
export type OptimizerFn = (
  func: ObjectiveFunction,
  x0: Vector,
  params?: Partial<OptimizerParams>,
) => OptimizationResult;

/**
 * Information about an optimizer
 */
export interface OptimizerInfo {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Short description */
  readonly description: string;
  /** Whether this uses the true Hessian */
  readonly usesTrueHessian: boolean;
  /** The optimizer function */
  readonly optimize: OptimizerFn;
}
