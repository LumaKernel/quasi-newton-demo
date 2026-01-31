import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { OptimizerInfo } from '@/core/optimizers/types.ts';
import { rosenbrock } from '@/core/functions/index.ts';
import { ContourPlot } from '@/visualization/ContourPlot.tsx';
import { MatrixComparison } from '@/visualization/MatrixComparison.tsx';
import { SurfacePlot3D } from '@/visualization/SurfacePlot3D/index.ts';
import {
  FunctionSelector,
  AlgorithmSelector,
  IterationControls,
  ComparisonPanel,
  LanguageSwitcher,
  ViewModeToggle,
  algorithmColors,
} from '@/components/index.ts';
import { useOptimization, useAnimation } from '@/hooks/index.ts';
import styles from './App.module.css';

type ViewMode = '2d' | '3d';

const App = () => {
  const { t } = useTranslation();
  const [selectedFunction, setSelectedFunction] = useState<ObjectiveFunction>(rosenbrock);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<readonly string[]>(['bfgs']);
  const [startPoint, setStartPoint] = useState<readonly [number, number]>(
    selectedFunction.defaultStart as [number, number],
  );
  const [viewMode, setViewMode] = useState<ViewMode>('2d');

  const { results, runOptimization, maxIterationCount } = useOptimization();

  const {
    currentIteration,
    isPlaying,
    speed,
    togglePlayPause,
    reset,
    goToIteration,
    setSpeed,
  } = useAnimation({ maxIteration: maxIterationCount });

  const handleFunctionChange = useCallback((func: ObjectiveFunction) => {
    setSelectedFunction(func);
    setStartPoint(func.defaultStart as [number, number]);
  }, []);

  const handleAlgorithmToggle = useCallback((optimizer: OptimizerInfo) => {
    setSelectedAlgorithms((prev) =>
      prev.includes(optimizer.id)
        ? prev.filter((id) => id !== optimizer.id)
        : [...prev, optimizer.id],
    );
  }, []);

  const handleStartPointChange = useCallback(
    (point: readonly [number, number]) => {
      setStartPoint(point);
      if (selectedAlgorithms.length > 0) {
        runOptimization(selectedFunction, point, selectedAlgorithms);
        reset();
      }
    },
    [selectedFunction, selectedAlgorithms, runOptimization, reset],
  );

  const handleRun = useCallback(() => {
    if (selectedAlgorithms.length > 0) {
      runOptimization(selectedFunction, startPoint, selectedAlgorithms);
      reset();
    }
  }, [selectedFunction, startPoint, selectedAlgorithms, runOptimization, reset]);

  // Get the first quasi-Newton result for Hessian comparison
  const quasiNewtonResult = useMemo(() => {
    for (const id of ['bfgs', 'dfp', 'sr1']) {
      const result = results.get(id);
      if (result) return { id, result };
    }
    return null;
  }, [results]);

  const currentIterationState = useMemo(() => {
    if (!quasiNewtonResult) return null;
    const { result } = quasiNewtonResult;
    const idx = Math.min(currentIteration, result.iterations.length - 1);
    return result.iterations[idx];
  }, [quasiNewtonResult, currentIteration]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>{t('app.title')}</h1>
            <p>{t('app.subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.controls}>
          <FunctionSelector
            selectedId={selectedFunction.id}
            onSelect={handleFunctionChange}
          />

          <AlgorithmSelector
            selectedIds={selectedAlgorithms}
            onToggle={handleAlgorithmToggle}
          />

          <ViewModeToggle value={viewMode} onChange={setViewMode} />

          <div className={styles.startPoint}>
            <label>{t('controls.startPoint')}</label>
            <div className={styles.pointInputs}>
              <input
                type="number"
                step="0.1"
                value={startPoint[0]}
                onChange={(e) =>
                  setStartPoint([Number(e.target.value), startPoint[1]])
                }
              />
              <input
                type="number"
                step="0.1"
                value={startPoint[1]}
                onChange={(e) =>
                  setStartPoint([startPoint[0], Number(e.target.value)])
                }
              />
            </div>
            <p className={styles.hint}>{t('controls.startPointHint')}</p>
          </div>

          <button className={styles.runButton} onClick={handleRun}>
            {t('controls.runOptimization')}
          </button>

        </section>

        {maxIterationCount > 0 && (
          <div className={styles.stickyControls}>
            <IterationControls
              currentIteration={currentIteration}
              maxIteration={maxIterationCount}
              isPlaying={isPlaying}
              speed={speed}
              onIterationChange={goToIteration}
              onPlayPause={togglePlayPause}
              onReset={reset}
              onSpeedChange={setSpeed}
            />
          </div>
        )}

        <section className={styles.visualization}>
          <div className={styles.plotContainer}>
            <h2>{t('visualization.optimizationPath')}</h2>
            {viewMode === '2d' ? (
              // 2D Contour View
              selectedAlgorithms.length > 0 && results.size > 0 ? (
                selectedAlgorithms.map((algId) => {
                  const result = results.get(algId);
                  if (!result) return null;
                  return (
                    <div key={algId} className={styles.plotWrapper}>
                      <div className={styles.plotHeader}>
                        <span
                          className={styles.colorDot}
                          style={{ background: algorithmColors[algId] }}
                        />
                        {algId.toUpperCase()}
                      </div>
                      <ContourPlot
                        func={selectedFunction}
                        iterations={result.iterations}
                        currentIteration={currentIteration}
                        width={450}
                        height={400}
                        onStartPointChange={handleStartPointChange}
                      />
                    </div>
                  );
                })
              ) : (
                <ContourPlot
                  func={selectedFunction}
                  iterations={[]}
                  currentIteration={0}
                  width={450}
                  height={400}
                  onStartPointChange={handleStartPointChange}
                />
              )
            ) : (
              // 3D Surface View
              selectedAlgorithms.length > 0 && results.size > 0 ? (
                selectedAlgorithms.map((algId) => {
                  const result = results.get(algId);
                  if (!result) return null;
                  return (
                    <div key={algId} className={styles.plotWrapper}>
                      <div className={styles.plotHeader}>
                        <span
                          className={styles.colorDot}
                          style={{ background: algorithmColors[algId] }}
                        />
                        {algId.toUpperCase()}
                      </div>
                      <SurfacePlot3D
                        func={selectedFunction}
                        iterations={result.iterations}
                        currentIteration={currentIteration}
                        width={450}
                        height={400}
                      />
                    </div>
                  );
                })
              ) : (
                <SurfacePlot3D
                  func={selectedFunction}
                  iterations={[]}
                  currentIteration={0}
                  width={450}
                  height={400}
                />
              )
            )}
          </div>

          <div className={styles.sidePanel}>
            <ComparisonPanel results={results} />

            {currentIterationState && quasiNewtonResult && (
              <MatrixComparison
                trueHessian={currentIterationState.trueHessian}
                approximateInverseHessian={currentIterationState.hessianApprox}
                iteration={currentIteration}
              />
            )}
          </div>
        </section>

        <section className={styles.explanation}>
          <h2>{t('explanation.title')}</h2>
          <div className={styles.explanationContent}>
            {(['steepestDescent', 'newton', 'bfgs', 'dfp', 'sr1'] as const).map((method) => {
              const links = t(`explanation.${method}.links`, { returnObjects: true }) as
                | readonly { readonly label: string; readonly url: string }[]
                | string;
              return (
                <div key={method} className={styles.explanationCard}>
                  <h3>{t(`explanation.${method}.title`)}</h3>
                  <p>{t(`explanation.${method}.description`)}</p>
                  {Array.isArray(links) && (
                    <div className={styles.links}>
                      {links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.references}>
            <h3>{t('explanation.references.title')}</h3>
            <a
              href={t('explanation.references.quasiNewton.url')}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('explanation.references.quasiNewton.label')}
            </a>
            <a
              href={t('explanation.references.nocedal.url')}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('explanation.references.nocedal.label')}
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>{t('app.footer')}</p>
      </footer>
    </div>
  );
};

export default App;
