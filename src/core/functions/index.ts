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
export { mccormick } from './mccormick.ts';
export { sixHumpCamel } from './sixHumpCamel.ts';
export { schaffer2 } from './schaffer2.ts';
export { bukin6 } from './bukin6.ts';
export { crossInTray } from './crossInTray.ts';
export { holderTable } from './holderTable.ts';
export { dropWave } from './dropWave.ts';
export { branin } from './branin.ts';

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
import { mccormick } from './mccormick.ts';
import { sixHumpCamel } from './sixHumpCamel.ts';
import { schaffer2 } from './schaffer2.ts';
import { bukin6 } from './bukin6.ts';
import { crossInTray } from './crossInTray.ts';
import { holderTable } from './holderTable.ts';
import { dropWave } from './dropWave.ts';
import { branin } from './branin.ts';
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
  mccormick,
  sixHumpCamel,
  schaffer2,
  bukin6,
  crossInTray,
  holderTable,
  dropWave,
  branin,
];

/**
 * Get a function by its ID
 */
export const getFunctionById = (id: string): ObjectiveFunction | undefined =>
  allFunctions.find((f) => f.id === id);
