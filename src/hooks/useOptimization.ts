import { useMemo } from 'react';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { OptimizationResult } from '@/core/optimizers/types.ts';
import { allOptimizers } from '@/core/optimizers/index.ts';

interface UseOptimizationParams {
  readonly func: ObjectiveFunction;
  readonly startPoint: readonly [number, number];
  readonly optimizerIds: readonly string[];
  readonly maxIterations?: number;
  readonly tolerance?: number;
}

export const useOptimization = ({
  func,
  startPoint,
  optimizerIds,
  maxIterations = 100,
  tolerance = 1e-6,
}: UseOptimizationParams) => {
  const results = useMemo(() => {
    if (optimizerIds.length === 0) {
      return new Map<string, OptimizationResult>();
    }

    const newResults = new Map<string, OptimizationResult>();

    for (const id of optimizerIds) {
      const optimizer = allOptimizers.find((o) => o.id === id);
      if (optimizer) {
        const result = optimizer.optimize(func, [...startPoint], {
          maxIterations,
          tolerance,
        });
        newResults.set(id, result);
      }
    }

    return newResults;
  }, [func, startPoint, optimizerIds, maxIterations, tolerance]);

  const maxIterationCount = useMemo(() => {
    let max = 0;
    results.forEach((result) => {
      max = Math.max(max, result.iterations.length - 1);
    });
    return max;
  }, [results]);

  return {
    results,
    maxIterationCount,
  };
};
