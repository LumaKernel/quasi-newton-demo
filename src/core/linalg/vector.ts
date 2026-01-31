import type { Vector, Matrix } from './types.ts';

/**
 * Add two vectors element-wise
 */
export const add = (a: Vector, b: Vector): Vector => a.map((v, i) => v + b[i]);

/**
 * Subtract vector b from vector a element-wise
 */
export const sub = (a: Vector, b: Vector): Vector => a.map((v, i) => v - b[i]);

/**
 * Scale a vector by a scalar
 */
export const scale = (v: Vector, s: number): Vector => v.map((x) => x * s);

/**
 * Negate a vector
 */
export const negate = (v: Vector): Vector => v.map((x) => -x);

/**
 * Compute the dot product of two vectors
 */
export const dot = (a: Vector, b: Vector): number =>
  a.reduce((sum, v, i) => sum + v * b[i], 0);

/**
 * Compute the Euclidean norm (L2 norm) of a vector
 */
export const norm = (v: Vector): number => Math.sqrt(dot(v, v));

/**
 * Normalize a vector to unit length
 */
export const normalize = (v: Vector): Vector => {
  const n = norm(v);
  return n === 0 ? v : scale(v, 1 / n);
};

/**
 * Compute the outer product of two vectors: a * b^T
 * Result is a matrix where result[i][j] = a[i] * b[j]
 */
export const outer = (a: Vector, b: Vector): Matrix =>
  a.map((ai) => b.map((bj) => ai * bj));

/**
 * Multiply a matrix by a vector: M * v
 */
export const matVec = (m: Matrix, v: Vector): Vector =>
  m.map((row) => dot(row, v));

/**
 * Create a zero vector of given dimension
 */
export const zeros = (n: number): Vector => Array.from({ length: n }, () => 0);

/**
 * Create a vector with all ones
 */
export const ones = (n: number): Vector => Array.from({ length: n }, () => 1);
