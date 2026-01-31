import type { ObjectiveFunction } from '../functions/types.ts';
import type { Vector, Matrix } from '../linalg/types.ts';
import type {
  OptimizerParams,
  OptimizationResult,
  IterationState,
  OptimizerInfo,
} from './types.ts';
import { defaultOptimizerParams } from './types.ts';
import { norm, add, scale, dot } from '../linalg/vector.ts';
import { inverse } from '../linalg/matrix.ts';

/**
 * Solve the trust region subproblem using the dogleg method
 *
 * Subproblem:
 *   min_d  m(d) = f + g^T d + (1/2) d^T B d
 *   s.t.   ||d|| ≤ Δ
 *
 * The dogleg method finds an approximate solution by considering:
 * 1. Cauchy point: steepest descent direction scaled to trust region
 * 2. Newton point: full Newton step (if B is positive definite)
 * 3. Dogleg path: interpolation between Cauchy and Newton points
 */
const solveTrustRegionSubproblem = (
  g: Vector,
  B: Matrix,
  delta: number,
): { d: Vector; onBoundary: boolean } => {
  const n = g.length;

  // Compute B * g
  const Bg = B.map((row) => row.reduce((sum, v, j) => sum + v * g[j], 0));

  // Compute g^T B g
  const gTBg = dot(g, Bg);

  // Cauchy point: minimize along steepest descent direction
  // d_c = -τ * g where τ minimizes m(-τg) subject to ||τg|| ≤ Δ
  const gNorm = norm(g);

  if (gNorm < 1e-12) {
    return { d: new Array(n).fill(0), onBoundary: false };
  }

  let tau: number;
  if (gTBg <= 0) {
    // Negative curvature: go to boundary
    tau = delta / gNorm;
  } else {
    // Positive curvature: unconstrained minimum along -g
    const tauU = (gNorm * gNorm) / gTBg;
    tau = Math.min(tauU, delta / gNorm);
  }

  const dCauchy = scale(g, -tau);
  const dCauchyNorm = norm(dCauchy);

  // Try to compute Newton point
  const Binv = inverse(B);
  if (Binv === null) {
    // B is singular, use Cauchy point
    return { d: dCauchy, onBoundary: dCauchyNorm >= delta - 1e-10 };
  }

  // Newton point: d_n = -B^{-1} g
  const dNewton = Binv.map((row) => -row.reduce((sum, v, j) => sum + v * g[j], 0));
  const dNewtonNorm = norm(dNewton);

  if (dNewtonNorm <= delta) {
    // Newton point is inside trust region
    return { d: dNewton, onBoundary: false };
  }

  // Dogleg: find point on path from Cauchy to Newton that intersects boundary
  // Path: d(τ) = d_c + τ(d_n - d_c) for τ ∈ [0, 1]
  // Find τ such that ||d(τ)|| = Δ

  const diff = dNewton.map((v, i) => v - dCauchy[i]);
  const a = dot(diff, diff);
  const b = 2 * dot(dCauchy, diff);
  const c = dot(dCauchy, dCauchy) - delta * delta;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0 || a < 1e-12) {
    return { d: dCauchy, onBoundary: true };
  }

  const tauDogleg = (-b + Math.sqrt(discriminant)) / (2 * a);
  const tauClamped = Math.max(0, Math.min(1, tauDogleg));

  const dDogleg = dCauchy.map((v, i) => v + tauClamped * diff[i]);
  return { d: dDogleg, onBoundary: true };
};

/**
 * Compute the quadratic model value: m(d) = g^T d + (1/2) d^T B d
 * (excluding the constant f term)
 */
const quadraticModelReduction = (g: Vector, B: Matrix, d: Vector): number => {
  // g^T d
  const gTd = dot(g, d);

  // d^T B d
  const Bd = B.map((row) => row.reduce((sum, v, j) => sum + v * d[j], 0));
  const dTBd = dot(d, Bd);

  // Model predicts: f + g^T d + 0.5 * d^T B d
  // Reduction from f: -(g^T d + 0.5 * d^T B d)
  return -(gTd + 0.5 * dTBd);
};

/**
 * Trust Region Method (Newton-based)
 *
 * At each iteration, solves the quadratic programming subproblem:
 *
 *   min_d  m_k(d) = f(x_k) + ∇f(x_k)^T d + (1/2) d^T H_k d
 *   s.t.   ||d|| ≤ Δ_k
 *
 * This is the core idea behind SQP (Sequential Quadratic Programming):
 * approximate the original problem with a quadratic subproblem and solve it.
 *
 * The trust region Δ_k is adjusted based on how well the quadratic model
 * predicts the actual function reduction.
 */
export const trustRegionOptimize = (
  func: ObjectiveFunction,
  x0: Vector,
  params: Partial<OptimizerParams> = {},
): OptimizationResult => {
  const { maxIterations, tolerance } = { ...defaultOptimizerParams, ...params };

  const iterations: IterationState[] = [];
  let x = x0;
  let functionEvaluations = 0;
  let gradientEvaluations = 0;

  // Trust region parameters
  let delta = 1.0; // Initial trust region radius
  const deltaMax = 10.0; // Maximum trust region radius
  const eta = 0.1; // Acceptance threshold

  for (let iter = 0; iter <= maxIterations; iter++) {
    const fx = func.value(x);
    const g = func.gradient(x);
    const H = func.hessian(x);
    functionEvaluations++;
    gradientEvaluations++;

    const gradNorm = norm(g);

    // For trust region, we use the true Hessian as the quadratic model
    // hessianApprox stores the current trust region radius scaled identity for visualization
    const Hinv = inverse(H);

    // Store iteration state
    const state: IterationState = {
      x,
      fx,
      gradient: g,
      gradientNorm: gradNorm,
      direction: null,
      alpha: delta, // Store trust region radius as alpha for display
      hessianApprox: Hinv ?? H, // Store inverse Hessian if available
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

    // Solve trust region subproblem
    const { d, onBoundary } = solveTrustRegionSubproblem(g, H, delta);

    // Compute actual reduction
    const xNew = add(x, d);
    const fxNew = func.value(xNew);
    functionEvaluations++;

    const actualReduction = fx - fxNew;
    const predictedReduction = quadraticModelReduction(g, H, d);

    // Compute ratio
    const rho = predictedReduction > 1e-12 ? actualReduction / predictedReduction : 0;

    // Update iteration with direction and trust region info
    iterations[iterations.length - 1] = {
      ...state,
      direction: d,
      alpha: delta,
    };

    // Update trust region radius
    if (rho < 0.25) {
      delta = 0.25 * delta;
    } else if (rho > 0.75 && onBoundary) {
      delta = Math.min(2 * delta, deltaMax);
    }

    // Accept or reject step
    if (rho > eta) {
      x = xNew;
    }
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

export const trustRegion: OptimizerInfo = {
  id: 'trustRegion',
  name: 'Trust Region (SQP)',
  description: 'Solves quadratic subproblem at each step with trust region constraint',
  usesTrueHessian: true,
  optimize: trustRegionOptimize,
};
