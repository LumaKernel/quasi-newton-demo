import type { ObjectiveFunction } from './types.ts';

/**
 * Easom function
 * f(x, y) = -cos(x)cos(y)exp(-((x-π)² + (y-π)²))
 *
 * Global minimum: (π, π) with f = -1
 * Unimodal with a very small area where the function deviates from zero
 */
export const easom: ObjectiveFunction = {
  id: 'easom',
  name: 'Easom',
  description: 'f(x,y) = -cos(x)cos(y)exp(-((x-π)²+(y-π)²))',
  dimension: 2,
  minima: [[Math.PI, Math.PI]],
  bounds: [-10, 10, -10, 10],
  defaultStart: [0, 0],

  value: ([x, y]) => {
    const xmp = x - Math.PI;
    const ymp = y - Math.PI;
    return -Math.cos(x) * Math.cos(y) * Math.exp(-(xmp * xmp + ymp * ymp));
  },

  gradient: ([x, y]) => {
    const xmp = x - Math.PI;
    const ymp = y - Math.PI;
    const cosx = Math.cos(x);
    const cosy = Math.cos(y);
    const sinx = Math.sin(x);
    const siny = Math.sin(y);
    const expTerm = Math.exp(-(xmp * xmp + ymp * ymp));

    const dx = sinx * cosy * expTerm + 2 * xmp * cosx * cosy * expTerm;
    const dy = cosx * siny * expTerm + 2 * ymp * cosx * cosy * expTerm;

    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const xmp = x - Math.PI;
    const ymp = y - Math.PI;
    const cosx = Math.cos(x);
    const cosy = Math.cos(y);
    const sinx = Math.sin(x);
    const siny = Math.sin(y);
    const expTerm = Math.exp(-(xmp * xmp + ymp * ymp));

    const h11 =
      cosx * cosy * expTerm +
      4 * xmp * sinx * cosy * expTerm +
      2 * cosx * cosy * expTerm -
      4 * xmp * xmp * cosx * cosy * expTerm;
    const h22 =
      cosx * cosy * expTerm +
      4 * ymp * cosx * siny * expTerm +
      2 * cosx * cosy * expTerm -
      4 * ymp * ymp * cosx * cosy * expTerm;
    const h12 =
      sinx * siny * expTerm +
      2 * xmp * cosx * siny * expTerm +
      2 * ymp * sinx * cosy * expTerm +
      4 * xmp * ymp * cosx * cosy * expTerm;

    return [
      [h11, h12],
      [h12, h22],
    ];
  },
};
