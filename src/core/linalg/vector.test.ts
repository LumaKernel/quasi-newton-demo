import { describe, it, expect } from 'vitest';
import { add, sub, scale, dot, norm, outer, matVec, normalize } from './vector.ts';

describe('vector operations', () => {
  describe('add', () => {
    it('adds two vectors element-wise', () => {
      expect(add([1, 2], [3, 4])).toEqual([4, 6]);
    });

    it('handles negative numbers', () => {
      expect(add([1, -2], [-3, 4])).toEqual([-2, 2]);
    });
  });

  describe('sub', () => {
    it('subtracts two vectors element-wise', () => {
      expect(sub([3, 4], [1, 2])).toEqual([2, 2]);
    });
  });

  describe('scale', () => {
    it('scales a vector by a scalar', () => {
      expect(scale([1, 2, 3], 2)).toEqual([2, 4, 6]);
    });

    it('handles zero scalar', () => {
      expect(scale([1, 2, 3], 0)).toEqual([0, 0, 0]);
    });
  });

  describe('dot', () => {
    it('computes dot product of two vectors', () => {
      expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    });

    it('returns 0 for orthogonal vectors', () => {
      expect(dot([1, 0], [0, 1])).toBe(0);
    });
  });

  describe('norm', () => {
    it('computes Euclidean norm', () => {
      expect(norm([3, 4])).toBe(5);
    });

    it('returns 0 for zero vector', () => {
      expect(norm([0, 0, 0])).toBe(0);
    });
  });

  describe('normalize', () => {
    it('normalizes a vector to unit length', () => {
      const result = normalize([3, 4]);
      expect(result[0]).toBeCloseTo(0.6);
      expect(result[1]).toBeCloseTo(0.8);
      expect(norm(result)).toBeCloseTo(1);
    });

    it('handles zero vector', () => {
      expect(normalize([0, 0])).toEqual([0, 0]);
    });
  });

  describe('outer', () => {
    it('computes outer product of two vectors', () => {
      const result = outer([1, 2], [3, 4]);
      expect(result).toEqual([
        [3, 4],
        [6, 8],
      ]);
    });
  });

  describe('matVec', () => {
    it('multiplies matrix by vector', () => {
      const m = [
        [1, 2],
        [3, 4],
      ];
      const v = [5, 6];
      expect(matVec(m, v)).toEqual([17, 39]);
    });

    it('handles identity matrix', () => {
      const I = [
        [1, 0],
        [0, 1],
      ];
      expect(matVec(I, [3, 4])).toEqual([3, 4]);
    });
  });
});
