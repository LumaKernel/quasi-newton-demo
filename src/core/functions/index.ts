export type { ObjectiveFunction } from './types.ts';
export { rosenbrock, createRosenbrock } from './rosenbrock.ts';
export { himmelblau } from './himmelblau.ts';
export { quadratic, createQuadratic, illConditionedQuadratic } from './quadratic.ts';
export { beale } from './beale.ts';

import { rosenbrock } from './rosenbrock.ts';
import { himmelblau } from './himmelblau.ts';
import { quadratic, illConditionedQuadratic } from './quadratic.ts';
import { beale } from './beale.ts';
import type { ObjectiveFunction } from './types.ts';

/**
 * All available objective functions for optimization
 */
export const allFunctions: readonly ObjectiveFunction[] = [
  rosenbrock,
  himmelblau,
  quadratic,
  illConditionedQuadratic,
  beale,
];

/**
 * Get a function by its ID
 */
export const getFunctionById = (id: string): ObjectiveFunction | undefined =>
  allFunctions.find((f) => f.id === id);
