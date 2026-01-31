import { describe, it, expect } from 'vitest';
import { rosenbrock } from './rosenbrock.ts';
import { himmelblau } from './himmelblau.ts';
import { quadratic } from './quadratic.ts';
import { beale } from './beale.ts';

describe('objective functions', () => {
  describe('rosenbrock', () => {
    it('has minimum at (1, 1)', () => {
      expect(rosenbrock.value([1, 1])).toBeCloseTo(0);
    });

    it('has zero gradient at minimum', () => {
      const g = rosenbrock.gradient([1, 1]);
      expect(g[0]).toBeCloseTo(0);
      expect(g[1]).toBeCloseTo(0);
    });

    it('evaluates correctly at origin', () => {
      // f(0, 0) = (1-0)^2 + 100*(0-0)^2 = 1
      expect(rosenbrock.value([0, 0])).toBeCloseTo(1);
    });

    it('gradient is correct at (0, 0)', () => {
      // df/dx = -2(1-x) - 400x(y-x^2) = -2 at (0,0)
      // df/dy = 200(y-x^2) = 0 at (0,0)
      const g = rosenbrock.gradient([0, 0]);
      expect(g[0]).toBeCloseTo(-2);
      expect(g[1]).toBeCloseTo(0);
    });

    it('hessian is symmetric', () => {
      const H = rosenbrock.hessian([0.5, 0.5]);
      expect(H[0][1]).toBeCloseTo(H[1][0]);
    });
  });

  describe('himmelblau', () => {
    it('has minimum at (3, 2)', () => {
      expect(himmelblau.value([3, 2])).toBeCloseTo(0);
    });

    it('has zero gradient at minimum', () => {
      const g = himmelblau.gradient([3, 2]);
      expect(g[0]).toBeCloseTo(0, 4);
      expect(g[1]).toBeCloseTo(0, 4);
    });

    it('has minimum at (-2.805118, 3.131312)', () => {
      expect(himmelblau.value([-2.805118, 3.131312])).toBeCloseTo(0, 2);
    });
  });

  describe('quadratic', () => {
    it('has minimum at (0, 0) for default parameters', () => {
      expect(quadratic.value([0, 0])).toBeCloseTo(0);
    });

    it('has zero gradient at minimum', () => {
      const g = quadratic.gradient([0, 0]);
      expect(g[0]).toBeCloseTo(0);
      expect(g[1]).toBeCloseTo(0);
    });

    it('hessian is constant', () => {
      const H1 = quadratic.hessian([0, 0]);
      const H2 = quadratic.hessian([1, 2]);
      expect(H1).toEqual(H2);
    });
  });

  describe('beale', () => {
    it('has minimum at (3, 0.5)', () => {
      expect(beale.value([3, 0.5])).toBeCloseTo(0);
    });

    it('has zero gradient at minimum', () => {
      const g = beale.gradient([3, 0.5]);
      expect(g[0]).toBeCloseTo(0, 4);
      expect(g[1]).toBeCloseTo(0, 4);
    });
  });
});

describe('gradient verification (numerical)', () => {
  const eps = 1e-7;

  const numericalGradient = (
    f: (x: readonly number[]) => number,
    x: readonly number[],
  ): number[] =>
    x.map((_, i) => {
      const xPlus = x.map((v, j) => (j === i ? v + eps : v));
      const xMinus = x.map((v, j) => (j === i ? v - eps : v));
      return (f(xPlus) - f(xMinus)) / (2 * eps);
    });

  it('rosenbrock gradient matches numerical gradient', () => {
    const x = [0.5, 0.7];
    const analytical = rosenbrock.gradient(x);
    const numerical = numericalGradient(rosenbrock.value, x);
    expect(analytical[0]).toBeCloseTo(numerical[0], 4);
    expect(analytical[1]).toBeCloseTo(numerical[1], 4);
  });

  it('himmelblau gradient matches numerical gradient', () => {
    const x = [1.2, -0.8];
    const analytical = himmelblau.gradient(x);
    const numerical = numericalGradient(himmelblau.value, x);
    expect(analytical[0]).toBeCloseTo(numerical[0], 4);
    expect(analytical[1]).toBeCloseTo(numerical[1], 4);
  });

  it('beale gradient matches numerical gradient', () => {
    const x = [1.5, 0.3];
    const analytical = beale.gradient(x);
    const numerical = numericalGradient(beale.value, x);
    expect(analytical[0]).toBeCloseTo(numerical[0], 4);
    expect(analytical[1]).toBeCloseTo(numerical[1], 4);
  });
});
