import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { OptimizerInfo } from '@/core/optimizers/types.ts';
import { rosenbrock } from '@/core/functions/index.ts';
import { ContourPlot } from '@/visualization/ContourPlot.tsx';
import { MatrixComparison } from '@/visualization/MatrixComparison.tsx';
import { SurfacePlot3D } from '@/visualization/SurfacePlot3D/index.ts';
import { ConvergenceCharts } from '@/visualization/ConvergenceCharts.tsx';
import { EigenvalueAnalysis } from '@/visualization/EigenvalueAnalysis.tsx';
import {
  FunctionSelector,
  AlgorithmSelector,
  IterationControls,
  ComparisonPanel,
  LanguageSwitcher,
  ViewModeToggle,
  StepDetails,
  FormulaLegend,
  algorithmColors,
} from '@/components/index.ts';
import { useOptimization, useAnimation } from '@/hooks/index.ts';
import styles from './App.module.css';

type ViewMode = '2d' | '3d';

const App = () => {
  const { t } = useTranslation();
  const [selectedFunction, setSelectedFunction] = useState<ObjectiveFunction>(rosenbrock);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<readonly string[]>([
    'steepestDescent',
    'newton',
    'bb',
    'trustRegion',
  ]);
  const [startPoint, setStartPoint] = useState<readonly [number, number]>(
    selectedFunction.defaultStart as [number, number],
  );
  const [viewMode, setViewMode] = useState<ViewMode>('2d');

  // Optimization results are derived from parameters - no useEffect needed
  const { results, maxIterationCount } = useOptimization({
    func: selectedFunction,
    startPoint,
    optimizerIds: selectedAlgorithms,
  });

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
    },
    [],
  );

  // Get the first quasi-Newton result for Hessian comparison
  // BB method also approximates inverse Hessian (as scalar * I)
  const quasiNewtonResult = useMemo(() => {
    for (const id of ['bfgs', 'dfp', 'sr1', 'bb']) {
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
          <div className={styles.headerActions}>
            <LanguageSwitcher />
            <a
              href="https://github.com/LumaKernel/quasi-newton-demo"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
              aria-label="GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
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

          <div className={styles.startPoint}>
            <label>{t('controls.startPoint')}</label>
            <div className={styles.pointInputs}>
              <input
                type="number"
                step="0.1"
                value={startPoint[0]}
                onChange={(e) =>
                  handleStartPointChange([Number(e.target.value), startPoint[1]])
                }
              />
              <input
                type="number"
                step="0.1"
                value={startPoint[1]}
                onChange={(e) =>
                  handleStartPointChange([startPoint[0], Number(e.target.value)])
                }
              />
            </div>
            <p className={styles.hint}>{t('controls.startPointHint')}</p>
          </div>
        </section>

        <div className={styles.stickyControls}>
          <div className={styles.stickyControlsInner}>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            {maxIterationCount > 0 && (
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
            )}
          </div>
        </div>

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
                        {t(`optimizers.${algId}.name`)}
                      </div>
                      <div className={styles.plotWithDetails}>
                        <ContourPlot
                          func={selectedFunction}
                          iterations={result.iterations}
                          currentIteration={currentIteration}
                          algorithmId={algId}
                          width={450}
                          height={400}
                          onStartPointChange={handleStartPointChange}
                        />
                        <StepDetails
                          algorithmId={algId}
                          iterations={result.iterations}
                          currentIteration={currentIteration}
                          color={algorithmColors[algId]}
                          func={selectedFunction}
                        />
                      </div>
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
                        {t(`optimizers.${algId}.name`)}
                      </div>
                      <div className={styles.plotWithDetails}>
                        <SurfacePlot3D
                          func={selectedFunction}
                          iterations={result.iterations}
                          currentIteration={currentIteration}
                          algorithmId={algId}
                          width={450}
                          height={400}
                        />
                        <StepDetails
                          algorithmId={algId}
                          iterations={result.iterations}
                          currentIteration={currentIteration}
                          color={algorithmColors[algId]}
                          func={selectedFunction}
                        />
                      </div>
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

            <ConvergenceCharts
              results={results}
              currentIteration={currentIteration}
              algorithmColors={algorithmColors}
            />

            <FormulaLegend />

            {currentIterationState && quasiNewtonResult && (
              <>
                <MatrixComparison
                  trueHessian={currentIterationState.trueHessian}
                  approximateInverseHessian={currentIterationState.hessianApprox}
                  iteration={currentIteration}
                />
                <EigenvalueAnalysis
                  trueHessian={currentIterationState.trueHessian}
                  approximateInverseHessian={currentIterationState.hessianApprox}
                  iteration={currentIteration}
                />
              </>
            )}
          </div>
        </section>

        <section className={styles.explanation}>
          <h2>{t('explanation.title')}</h2>
          <div className={styles.explanationContent}>
            {(['steepestDescent', 'bb', 'newton', 'trustRegion', 'bfgs', 'dfp', 'sr1'] as const).map((method) => {
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
