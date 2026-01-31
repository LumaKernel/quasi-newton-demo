import type { Vector, Matrix } from '../linalg/types.ts';

/**
 * An objective function for optimization
 */
export interface ObjectiveFunction {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Dimension of input (typically 2 for visualization) */
  readonly dimension: number;
  /** Known global minima */
  readonly minima: readonly Vector[];
  /** Recommended visualization bounds [xMin, xMax, yMin, yMax] */
  readonly bounds: readonly [number, number, number, number];
  /** Default starting point for optimization */
  readonly defaultStart: Vector;

  /** Evaluate the function at point x */
  readonly value: (x: Vector) => number;
  /** Compute the gradient at point x */
  readonly gradient: (x: Vector) => Vector;
  /** Compute the Hessian matrix at point x (for Newton's method comparison) */
  readonly hessian: (x: Vector) => Matrix;
}
