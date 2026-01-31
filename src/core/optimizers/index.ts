export type {
  IterationState,
  OptimizationResult,
  OptimizerParams,
  OptimizerFn,
  OptimizerInfo,
} from './types.ts';
export { defaultOptimizerParams } from './types.ts';
export { newton, newtonOptimize } from './newton.ts';
export { bfgs, bfgsOptimize, bfgsUpdate } from './bfgs.ts';
export { dfp, dfpOptimize, dfpUpdate } from './dfp.ts';
export { sr1, sr1Optimize, sr1Update } from './sr1.ts';
export { steepestDescent, gradientDescent } from './gradientDescent.ts';

import { newton } from './newton.ts';
import { bfgs } from './bfgs.ts';
import { dfp } from './dfp.ts';
import { sr1 } from './sr1.ts';
import { steepestDescent } from './gradientDescent.ts';
import type { OptimizerInfo } from './types.ts';

/**
 * All available optimizers
 */
export const allOptimizers: readonly OptimizerInfo[] = [
  steepestDescent,
  newton,
  bfgs,
  dfp,
  sr1,
];

/**
 * Get an optimizer by its ID
 */
export const getOptimizerById = (id: string): OptimizerInfo | undefined =>
  allOptimizers.find((o) => o.id === id);
