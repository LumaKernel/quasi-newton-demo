import type { ObjectiveFunction } from './types.ts';

/**
 * Lévi function N.13
 * f(x, y) = sin²(3πx) + (x-1)²(1 + sin²(3πy)) + (y-1)²(1 + sin²(2πy))
 *
 * Global minimum: (1, 1) with f = 0
 * Highly multimodal function
 */
export const levi: ObjectiveFunction = {
  id: 'levi',
  name: 'Lévi N.13',
  description: 'f(x,y) = sin²(3πx) + (x-1)²(1+sin²(3πy)) + (y-1)²(1+sin²(2πy))',
  dimension: 2,
  minima: [[1, 1]],
  bounds: [-10, 10, -10, 10],
  defaultStart: [-4, 4],

  value: ([x, y]) => {
    const sin3pix = Math.sin(3 * Math.PI * x);
    const sin3piy = Math.sin(3 * Math.PI * y);
    const sin2piy = Math.sin(2 * Math.PI * y);
    const xm1 = x - 1;
    const ym1 = y - 1;
    return (
      sin3pix * sin3pix +
      xm1 * xm1 * (1 + sin3piy * sin3piy) +
      ym1 * ym1 * (1 + sin2piy * sin2piy)
    );
  },

  gradient: ([x, y]) => {
    const sin3pix = Math.sin(3 * Math.PI * x);
    const cos3pix = Math.cos(3 * Math.PI * x);
    const sin3piy = Math.sin(3 * Math.PI * y);
    const cos3piy = Math.cos(3 * Math.PI * y);
    const sin2piy = Math.sin(2 * Math.PI * y);
    const cos2piy = Math.cos(2 * Math.PI * y);
    const xm1 = x - 1;
    const ym1 = y - 1;

    const dx =
      6 * Math.PI * sin3pix * cos3pix +
      2 * xm1 * (1 + sin3piy * sin3piy);

    const dy =
      xm1 * xm1 * 6 * Math.PI * sin3piy * cos3piy +
      2 * ym1 * (1 + sin2piy * sin2piy) +
      ym1 * ym1 * 4 * Math.PI * sin2piy * cos2piy;

    return [dx, dy];
  },

  hessian: ([x, y]) => {
    const sin3pix = Math.sin(3 * Math.PI * x);
    const cos3pix = Math.cos(3 * Math.PI * x);
    const sin3piy = Math.sin(3 * Math.PI * y);
    const cos3piy = Math.cos(3 * Math.PI * y);
    const sin2piy = Math.sin(2 * Math.PI * y);
    const cos2piy = Math.cos(2 * Math.PI * y);
    const xm1 = x - 1;
    const ym1 = y - 1;

    const h11 =
      18 * Math.PI * Math.PI * (cos3pix * cos3pix - sin3pix * sin3pix) +
      2 * (1 + sin3piy * sin3piy);

    const h12 = 4 * xm1 * 3 * Math.PI * sin3piy * cos3piy;

    const h22 =
      xm1 * xm1 * 18 * Math.PI * Math.PI * (cos3piy * cos3piy - sin3piy * sin3piy) +
      2 * (1 + sin2piy * sin2piy) +
      4 * ym1 * 2 * Math.PI * sin2piy * cos2piy +
      ym1 * ym1 * 8 * Math.PI * Math.PI * (cos2piy * cos2piy - sin2piy * sin2piy);

    return [
      [h11, h12],
      [h12, h22],
    ];
  },
};
