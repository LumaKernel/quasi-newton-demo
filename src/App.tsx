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
  const [selectedHessianAlgorithm, setSelectedHessianAlgorithm] = useState<string>('bfgs');

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

  // Get all quasi-Newton algorithms with hessianApprox data for Hessian comparison
  const quasiNewtonAlgorithms = useMemo(() => {
    const algos: Array<{
      readonly id: string;
      readonly hessianApprox: readonly (readonly number[])[];
      readonly trueHessian: readonly (readonly number[])[];
    }> = [];
    for (const id of ['bfgs', 'dfp', 'sr1', 'bb']) {
      const result = results.get(id);
      if (result) {
        const idx = Math.min(currentIteration, result.iterations.length - 1);
        const state = result.iterations[idx];
        if (state?.hessianApprox && state?.trueHessian) {
          algos.push({
            id,
            hessianApprox: state.hessianApprox,
            trueHessian: state.trueHessian,
          });
        }
      }
    }
    return algos;
  }, [results, currentIteration]);

  // Auto-select first available algorithm if current selection is not available
  const effectiveHessianAlgorithm = useMemo(() => {
    if (quasiNewtonAlgorithms.some((a) => a.id === selectedHessianAlgorithm)) {
      return selectedHessianAlgorithm;
    }
    return quasiNewtonAlgorithms[0]?.id ?? 'bfgs';
  }, [quasiNewtonAlgorithms, selectedHessianAlgorithm]);

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
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
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

            {quasiNewtonAlgorithms.length > 0 && (
              <>
                <MatrixComparison
                  availableAlgorithms={quasiNewtonAlgorithms}
                  selectedAlgorithmId={effectiveHessianAlgorithm}
                  onAlgorithmChange={setSelectedHessianAlgorithm}
                  iteration={currentIteration}
                  algorithmColors={algorithmColors}
                />
                <EigenvalueAnalysis
                  availableAlgorithms={quasiNewtonAlgorithms}
                  selectedAlgorithmId={effectiveHessianAlgorithm}
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
