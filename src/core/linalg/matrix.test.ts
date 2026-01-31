import { describe, it, expect } from 'vitest';
import { identity, add, sub, scale, mul, transpose, inverse, solve } from './matrix.ts';

describe('matrix operations', () => {
  describe('identity', () => {
    it('creates 2x2 identity matrix', () => {
      expect(identity(2)).toEqual([
        [1, 0],
        [0, 1],
      ]);
    });

    it('creates 3x3 identity matrix', () => {
      expect(identity(3)).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    });
  });

  describe('add', () => {
    it('adds two matrices element-wise', () => {
      const a = [
        [1, 2],
        [3, 4],
      ];
      const b = [
        [5, 6],
        [7, 8],
      ];
      expect(add(a, b)).toEqual([
        [6, 8],
        [10, 12],
      ]);
    });
  });

  describe('sub', () => {
    it('subtracts two matrices element-wise', () => {
      const a = [
        [5, 6],
        [7, 8],
      ];
      const b = [
        [1, 2],
        [3, 4],
      ];
      expect(sub(a, b)).toEqual([
        [4, 4],
        [4, 4],
      ]);
    });
  });

  describe('scale', () => {
    it('scales a matrix by a scalar', () => {
      const m = [
        [1, 2],
        [3, 4],
      ];
      expect(scale(m, 2)).toEqual([
        [2, 4],
        [6, 8],
      ]);
    });
  });

  describe('mul', () => {
    it('multiplies two 2x2 matrices', () => {
      const a = [
        [1, 2],
        [3, 4],
      ];
      const b = [
        [5, 6],
        [7, 8],
      ];
      expect(mul(a, b)).toEqual([
        [19, 22],
        [43, 50],
      ]);
    });

    it('multiplies with identity matrix', () => {
      const m = [
        [1, 2],
        [3, 4],
      ];
      const I = identity(2);
      expect(mul(m, I)).toEqual(m);
      expect(mul(I, m)).toEqual(m);
    });
  });

  describe('transpose', () => {
    it('transposes a 2x2 matrix', () => {
      const m = [
        [1, 2],
        [3, 4],
      ];
      expect(transpose(m)).toEqual([
        [1, 3],
        [2, 4],
      ]);
    });

    it('transposes a rectangular matrix', () => {
      const m = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      expect(transpose(m)).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    });
  });

  describe('inverse', () => {
    it('inverts a 2x2 matrix', () => {
      const m = [
        [4, 7],
        [2, 6],
      ];
      const inv = inverse(m);
      expect(inv).not.toBeNull();
      if (inv) {
        expect(inv[0][0]).toBeCloseTo(0.6);
        expect(inv[0][1]).toBeCloseTo(-0.7);
        expect(inv[1][0]).toBeCloseTo(-0.2);
        expect(inv[1][1]).toBeCloseTo(0.4);
      }
    });

    it('returns null for singular matrix', () => {
      const m = [
        [1, 2],
        [2, 4],
      ];
      expect(inverse(m)).toBeNull();
    });

    it('inverts a 3x3 matrix correctly', () => {
      const m = [
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0],
      ];
      const inv = inverse(m);
      expect(inv).not.toBeNull();
      if (inv) {
        // M * M^(-1) should be identity
        const product = mul(m, inv);
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            expect(product[i][j]).toBeCloseTo(i === j ? 1 : 0);
          }
        }
      }
    });
  });

  describe('solve', () => {
    it('solves a 2x2 linear system', () => {
      const A = [
        [2, 1],
        [1, 3],
      ];
      const b = [5, 10];
      const x = solve(A, b);
      expect(x).not.toBeNull();
      if (x) {
        expect(x[0]).toBeCloseTo(1);
        expect(x[1]).toBeCloseTo(3);
      }
    });
  });
});
