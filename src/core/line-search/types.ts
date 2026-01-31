import type { Vector } from '../linalg/types.ts';

/**
 * Parameters for line search algorithms
 */
export interface LineSearchParams {
  /** Armijo condition parameter (typically 1e-4) */
  readonly c1: number;
  /** Wolfe curvature condition parameter (typically 0.9 for quasi-Newton) */
  readonly c2: number;
  /** Maximum number of iterations */
  readonly maxIterations: number;
  /** Initial step size */
  readonly initialAlpha: number;
}

/**
 * Result of a line search
 */
export interface LineSearchResult {
  /** Optimal step size */
  readonly alpha: number;
  /** Number of function evaluations */
  readonly evaluations: number;
  /** Whether the search succeeded */
  readonly success: boolean;
}

/**
 * Function type for line search algorithms
 */
export type LineSearchFn = (
  f: (x: Vector) => number,
  grad: (x: Vector) => Vector,
  x: Vector,
  direction: Vector,
  params?: Partial<LineSearchParams>,
) => LineSearchResult;

export const defaultLineSearchParams: LineSearchParams = {
  c1: 1e-4,
  c2: 0.9,
  maxIterations: 50,
  initialAlpha: 1.0,
};
