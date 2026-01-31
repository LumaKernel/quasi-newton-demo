export type { ObjectiveFunction } from './types.ts';
export { rosenbrock, createRosenbrock } from './rosenbrock.ts';
export { himmelblau } from './himmelblau.ts';
export { quadratic, createQuadratic, illConditionedQuadratic } from './quadratic.ts';
export { beale } from './beale.ts';
export { booth } from './booth.ts';
export { matyas } from './matyas.ts';
export { threeHumpCamel } from './threeHumpCamel.ts';
export { sphere } from './sphere.ts';
export { levi } from './levi.ts';
export { rastrigin } from './rastrigin.ts';
export { ackley } from './ackley.ts';
export { goldsteinPrice } from './goldsteinPrice.ts';
export { easom } from './easom.ts';
export { styblinskiTang } from './styblinskiTang.ts';

import { rosenbrock } from './rosenbrock.ts';
import { himmelblau } from './himmelblau.ts';
import { quadratic, illConditionedQuadratic } from './quadratic.ts';
import { beale } from './beale.ts';
import { booth } from './booth.ts';
import { matyas } from './matyas.ts';
import { threeHumpCamel } from './threeHumpCamel.ts';
import { sphere } from './sphere.ts';
import { levi } from './levi.ts';
import { rastrigin } from './rastrigin.ts';
import { ackley } from './ackley.ts';
import { goldsteinPrice } from './goldsteinPrice.ts';
import { easom } from './easom.ts';
import { styblinskiTang } from './styblinskiTang.ts';
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
  booth,
  matyas,
  threeHumpCamel,
  sphere,
  levi,
  rastrigin,
  ackley,
  goldsteinPrice,
  easom,
  styblinskiTang,
];

/**
 * Get a function by its ID
 */
export const getFunctionById = (id: string): ObjectiveFunction | undefined =>
  allFunctions.find((f) => f.id === id);
