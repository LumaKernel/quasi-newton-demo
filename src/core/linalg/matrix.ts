import type { Matrix, Vector } from './types.ts';

/**
 * Create an identity matrix of size n x n
 */
export const identity = (n: number): Matrix =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );

/**
 * Create a zero matrix of size rows x cols
 */
export const zeros = (rows: number, cols: number): Matrix =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

/**
 * Add two matrices element-wise
 */
export const add = (a: Matrix, b: Matrix): Matrix =>
  a.map((row, i) => row.map((v, j) => v + b[i][j]));

/**
 * Subtract matrix b from matrix a element-wise
 */
export const sub = (a: Matrix, b: Matrix): Matrix =>
  a.map((row, i) => row.map((v, j) => v - b[i][j]));

/**
 * Scale a matrix by a scalar
 */
export const scale = (m: Matrix, s: number): Matrix =>
  m.map((row) => row.map((v) => v * s));

/**
 * Multiply two matrices: A * B
 */
export const mul = (a: Matrix, b: Matrix): Matrix => {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;

  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < inner; k++) {
        sum += a[i][k] * b[k][j];
      }
      return sum;
    }),
  );
};

/**
 * Transpose a matrix
 */
export const transpose = (m: Matrix): Matrix =>
  m[0].map((_, j) => m.map((row) => row[j]));

/**
 * Get the diagonal elements of a matrix as a vector
 */
export const diag = (m: Matrix): Vector => m.map((row, i) => row[i]);

/**
 * Create a diagonal matrix from a vector
 */
export const diagMatrix = (v: Vector): Matrix =>
  v.map((val, i) => v.map((_, j) => (i === j ? val : 0)));

/**
 * Compute the trace of a matrix (sum of diagonal elements)
 */
export const trace = (m: Matrix): number =>
  m.reduce((sum, row, i) => sum + row[i], 0);

/**
 * Frobenius norm of a matrix
 */
export const frobeniusNorm = (m: Matrix): number =>
  Math.sqrt(m.reduce((sum, row) => sum + row.reduce((s, v) => s + v * v, 0), 0));

/**
 * Compute the inverse of a 2x2 matrix using the direct formula
 * For larger matrices, use the general inverse function
 */
export const inverse2x2 = (m: Matrix): Matrix | null => {
  const [[a, b], [c, d]] = m;
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-12) {
    return null;
  }
  const invDet = 1 / det;
  return [
    [d * invDet, -b * invDet],
    [-c * invDet, a * invDet],
  ];
};

/**
 * Compute the inverse of a matrix using Gaussian elimination with partial pivoting
 */
export const inverse = (m: Matrix): Matrix | null => {
  const n = m.length;
  if (n !== m[0].length) {
    return null; // Not square
  }

  if (n === 2) {
    return inverse2x2(m);
  }

  // Create augmented matrix [A | I]
  const aug: number[][] = m.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(aug[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) {
      return null; // Singular matrix
    }

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Eliminate column
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  // Extract inverse from augmented matrix
  return aug.map((row) => row.slice(n));
};

/**
 * Solve a linear system Ax = b using Gaussian elimination
 */
export const solve = (a: Matrix, b: Vector): Vector | null => {
  const inv = inverse(a);
  if (inv === null) {
    return null;
  }
  return inv.map((row) => row.reduce((sum, v, j) => sum + v * b[j], 0));
};
