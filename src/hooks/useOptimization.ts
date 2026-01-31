import { useState, useCallback, useMemo } from 'react';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { OptimizationResult } from '@/core/optimizers/types.ts';
import { allOptimizers } from '@/core/optimizers/index.ts';

interface UseOptimizationOptions {
  readonly maxIterations?: number;
  readonly tolerance?: number;
}

export const useOptimization = (options: UseOptimizationOptions = {}) => {
  const { maxIterations = 100, tolerance = 1e-6 } = options;

  const [results, setResults] = useState<ReadonlyMap<string, OptimizationResult>>(
    new Map(),
  );
  const [isRunning, setIsRunning] = useState(false);

  const runOptimization = useCallback(
    (
      func: ObjectiveFunction,
      startPoint: readonly [number, number],
      optimizerIds: readonly string[],
    ) => {
      setIsRunning(true);

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

      setResults(newResults);
      setIsRunning(false);

      return newResults;
    },
    [maxIterations, tolerance],
  );

  const clearResults = useCallback(() => {
    setResults(new Map());
  }, []);

  const maxIterationCount = useMemo(() => {
    let max = 0;
    results.forEach((result) => {
      max = Math.max(max, result.iterations.length - 1);
    });
    return max;
  }, [results]);

  return {
    results,
    isRunning,
    runOptimization,
    clearResults,
    maxIterationCount,
  };
};
