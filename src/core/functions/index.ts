export type { ObjectiveFunction } from './types.ts';
export { rosenbrock, createRosenbrock } from './rosenbrock.ts';
export { himmelblau } from './himmelblau.ts';
export { quadratic, createQuadratic, illConditionedQuadratic } from './quadratic.ts';
export { beale } from './beale.ts';
export { booth } from './booth.ts';
export { matyas } from './matyas.ts';
export { threeHumpCamel } from './threeHumpCamel.ts';
export { sphere } from './sphere.ts';
export { trid } from './trid.ts';
export { zakharov } from './zakharov.ts';
export { sumSquares } from './sumSquares.ts';
export { dixonPrice } from './dixonPrice.ts';
export { rotatedEllipsoid } from './rotatedEllipsoid.ts';
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
import { trid } from './trid.ts';
import { zakharov } from './zakharov.ts';
import { sumSquares } from './sumSquares.ts';
import { dixonPrice } from './dixonPrice.ts';
import { rotatedEllipsoid } from './rotatedEllipsoid.ts';
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
 * Organized roughly by complexity: simple quadratics first, then moderate, then complex
 */
export const allFunctions: readonly ObjectiveFunction[] = [
  // Simple (convex, single minimum)
  sphere,
  quadratic,
  illConditionedQuadratic,
  sumSquares,
  rotatedEllipsoid,
  trid,
  booth,
  matyas,
  // Moderate complexity (valleys, some nonlinearity)
  rosenbrock,
  beale,
  zakharov,
  dixonPrice,
  threeHumpCamel,
  mccormick,
  branin,
  // More complex (multiple minima or special structure)
  himmelblau,
  goldsteinPrice,
  sixHumpCamel,
  styblinskiTang,
  levi,
  // Highly complex (many local minima)
  rastrigin,
  ackley,
  schaffer2,
  easom,
  bukin6,
  crossInTray,
  holderTable,
  dropWave,
];

/**
 * Get a function by its ID
 */
export const getFunctionById = (id: string): ObjectiveFunction | undefined =>
  allFunctions.find((f) => f.id === id);
