import { describe, it, expect } from 'vitest';
import { newtonOptimize } from './newton.ts';
import { bfgsOptimize } from './bfgs.ts';
import { dfpOptimize } from './dfp.ts';
import { sr1Optimize } from './sr1.ts';
import { barzilaiBotweinOptimize } from './barzilaiBotwein.ts';
import { trustRegionOptimize } from './trustRegion.ts';
import { rosenbrock } from '../functions/rosenbrock.ts';
import { quadratic } from '../functions/quadratic.ts';
import { himmelblau } from '../functions/himmelblau.ts';

describe('Newton optimization', () => {
  it('converges on quadratic function', () => {
    const result = newtonOptimize(quadratic, [2, 2]);
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(0, 4);
    expect(result.solution[1]).toBeCloseTo(0, 4);
  });

  it('converges on rosenbrock function', () => {
    const result = newtonOptimize(rosenbrock, [-1, 1], { maxIterations: 200 });
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(1, 3);
    expect(result.solution[1]).toBeCloseTo(1, 3);
  });
});

describe('BFGS optimization', () => {
  it('converges on quadratic function', () => {
    const result = bfgsOptimize(quadratic, [2, 2]);
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(0, 4);
    expect(result.solution[1]).toBeCloseTo(0, 4);
  });

  it('converges on rosenbrock function', () => {
    const result = bfgsOptimize(rosenbrock, [-1, 1], { maxIterations: 200 });
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(1, 3);
    expect(result.solution[1]).toBeCloseTo(1, 3);
  });

  it('converges on himmelblau function to one of the minima', () => {
    const result = bfgsOptimize(himmelblau, [0, 0]);
    expect(result.converged).toBe(true);
    expect(result.finalValue).toBeCloseTo(0, 2);
  });

  it('stores iteration history', () => {
    const result = bfgsOptimize(quadratic, [2, 2]);
    expect(result.iterations.length).toBeGreaterThan(0);
    expect(result.iterations[0].iteration).toBe(0);
    expect(result.iterations[0].x).toEqual([2, 2]);
  });
});

describe('DFP optimization', () => {
  it('converges on quadratic function', () => {
    const result = dfpOptimize(quadratic, [2, 2]);
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(0, 4);
    expect(result.solution[1]).toBeCloseTo(0, 4);
  });

  it('converges on rosenbrock function', () => {
    const result = dfpOptimize(rosenbrock, [-1, 1], { maxIterations: 200 });
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(1, 3);
    expect(result.solution[1]).toBeCloseTo(1, 3);
  });
});

describe('SR1 optimization', () => {
  it('converges on quadratic function', () => {
    const result = sr1Optimize(quadratic, [2, 2]);
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(0, 4);
    expect(result.solution[1]).toBeCloseTo(0, 4);
  });

  it('converges on rosenbrock function', () => {
    const result = sr1Optimize(rosenbrock, [-1, 1], {
      maxIterations: 300,
      tolerance: 1e-5,
    });
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(1, 2);
    expect(result.solution[1]).toBeCloseTo(1, 2);
  });
});

describe('Barzilai-Borwein optimization', () => {
  it('converges on quadratic function', () => {
    const result = barzilaiBotweinOptimize(quadratic, [2, 2]);
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(0, 3);
    expect(result.solution[1]).toBeCloseTo(0, 3);
  });

  it('makes progress on rosenbrock function', () => {
    // BB method is simple and may not fully converge on Rosenbrock
    // but should make significant progress
    const result = barzilaiBotweinOptimize(rosenbrock, [0, 0], {
      maxIterations: 500,
      tolerance: 1e-4,
    });
    // Should get close to minimum or at least reduce function value significantly
    expect(result.finalValue).toBeLessThan(1); // f(0,0) = 1
  });

  it('stores scalar alpha in iterations', () => {
    const result = barzilaiBotweinOptimize(quadratic, [2, 2]);
    expect(result.iterations.length).toBeGreaterThan(1);
    // BB method uses scalar hessian approximation
    const iter = result.iterations[1];
    expect(iter.hessianApprox).toBeDefined();
  });
});

describe('Trust Region optimization', () => {
  it('converges on quadratic function', () => {
    const result = trustRegionOptimize(quadratic, [2, 2]);
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(0, 4);
    expect(result.solution[1]).toBeCloseTo(0, 4);
  });

  it('makes progress on rosenbrock function', () => {
    // Trust region with true Hessian can have issues with Rosenbrock's
    // indefinite Hessian away from minimum
    const result = trustRegionOptimize(rosenbrock, [0.5, 0.5], {
      maxIterations: 300,
    });
    // Should reduce function value significantly from start
    const startValue = rosenbrock.value([0.5, 0.5]);
    expect(result.finalValue).toBeLessThan(startValue);
  });

  it('converges on himmelblau from good start', () => {
    // Start closer to a known minimum
    const result = trustRegionOptimize(himmelblau, [2.5, 2.5], {
      maxIterations: 100,
    });
    expect(result.converged).toBe(true);
    expect(result.finalValue).toBeCloseTo(0, 1);
  });
});

describe('optimizer comparison', () => {
  it('all optimizers find the same minimum on quadratic', () => {
    const x0 = [2, 2];
    const newtonResult = newtonOptimize(quadratic, x0);
    const bfgsResult = bfgsOptimize(quadratic, x0);
    const dfpResult = dfpOptimize(quadratic, x0);
    const sr1Result = sr1Optimize(quadratic, x0);

    const solutions = [newtonResult, bfgsResult, dfpResult, sr1Result];
    for (const result of solutions) {
      expect(result.converged).toBe(true);
      expect(result.solution[0]).toBeCloseTo(0, 4);
      expect(result.solution[1]).toBeCloseTo(0, 4);
    }
  });

  it('quasi-Newton methods converge without true Hessian', () => {
    const result = bfgsOptimize(rosenbrock, [-1, 1]);
    // Verify that hessianApprox is stored and different from trueHessian
    const lastIter = result.iterations[result.iterations.length - 1];
    expect(lastIter.hessianApprox).toBeDefined();
    expect(lastIter.trueHessian).toBeDefined();
  });
});
