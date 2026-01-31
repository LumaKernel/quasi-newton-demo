import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { IterationState } from '@/core/optimizers/types.ts';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import { Tooltip } from '@/components/Tooltip.tsx';
import { useVisualization, type OverlayData } from '@/contexts/index.ts';
import { LineSearchChart } from '@/visualization/LineSearchChart.tsx';
import { SecantCondition } from '@/visualization/SecantCondition.tsx';
import styles from './StepDetails.module.css';

interface StepDetailsProps {
  readonly algorithmId: string;
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly color: string;
  readonly func?: ObjectiveFunction;
}

const formatNumber = (n: number, precision = 4): string => {
  if (Math.abs(n) < 0.0001 && n !== 0) {
    return n.toExponential(2);
  }
  return n.toFixed(precision);
};

const formatVectorLatex = (v: readonly number[], precision = 4): string => {
  const entries = v.map((x) => formatNumber(x, precision)).join(' \\\\ ');
  return `\\begin{pmatrix} ${entries} \\end{pmatrix}`;
};

type FormulaKey = 'steepestDescent' | 'bb' | 'newton' | 'trustRegion' | 'bfgs' | 'dfp' | 'sr1';

const methodFormulas: Record<
  FormulaKey,
  {
    readonly direction: string;
    readonly directionDesc: string;
    readonly update: string;
    readonly hessianUpdate?: string;
    readonly scalarUpdate?: string;
    readonly qpSubproblem?: string;
    readonly trustRegionUpdate?: string;
  }
> = {
  steepestDescent: {
    direction: 'd_k = -\\nabla f(x_k)',
    directionDesc: 'Negative gradient (steepest descent direction)',
    update: 'x_{k+1} = x_k + \\alpha_k d_k',
  },
  bb: {
    direction: 'd_k = -\\alpha_k \\nabla f(x_k)',
    directionDesc: 'Scaled gradient using BB step size',
    update: 'x_{k+1} = x_k + d_k',
    scalarUpdate: '\\alpha_k = \\frac{s_{k-1}^T s_{k-1}}{s_{k-1}^T y_{k-1}} = \\frac{\\|s_{k-1}\\|^2}{s_{k-1}^T y_{k-1}}',
  },
  newton: {
    direction: 'd_k = -H^{-1} \\nabla f(x_k)',
    directionDesc: 'Newton direction using true inverse Hessian',
    update: 'x_{k+1} = x_k + \\alpha_k d_k',
  },
  trustRegion: {
    direction: 'd_k = \\arg\\min_d m_k(d)',
    directionDesc: 'Solution of QP subproblem',
    update: 'x_{k+1} = x_k + d_k \\quad (\\text{if } \\rho_k > \\eta)',
    qpSubproblem: '\\min_d \\; m_k(d) = f_k + \\nabla f_k^T d + \\frac{1}{2} d^T H_k d \\quad \\text{s.t.} \\; \\|d\\| \\leq \\Delta_k',
    trustRegionUpdate: '\\rho_k = \\frac{f(x_k) - f(x_k + d_k)}{m_k(0) - m_k(d_k)}',
  },
  bfgs: {
    direction: 'd_k = -B_k \\nabla f(x_k)',
    directionDesc: 'Quasi-Newton direction using BFGS approximation',
    update: 'x_{k+1} = x_k + \\alpha_k d_k',
    hessianUpdate:
      'B_{k+1} = \\left(I - \\rho_k s_k y_k^T\\right) B_k \\left(I - \\rho_k y_k s_k^T\\right) + \\rho_k s_k s_k^T',
  },
  dfp: {
    direction: 'd_k = -B_k \\nabla f(x_k)',
    directionDesc: 'Quasi-Newton direction using DFP approximation',
    update: 'x_{k+1} = x_k + \\alpha_k d_k',
    hessianUpdate:
      'B_{k+1} = B_k + \\frac{s_k s_k^T}{s_k^T y_k} - \\frac{B_k y_k y_k^T B_k}{y_k^T B_k y_k}',
  },
  sr1: {
    direction: 'd_k = -B_k \\nabla f(x_k)',
    directionDesc: 'Quasi-Newton direction using SR1 approximation',
    update: 'x_{k+1} = x_k + \\alpha_k d_k',
    hessianUpdate:
      'B_{k+1} = B_k + \\frac{(s_k - B_k y_k)(s_k - B_k y_k)^T}{(s_k - B_k y_k)^T y_k}',
  },
};

export const StepDetails = ({
  algorithmId,
  iterations,
  currentIteration,
  color,
  func,
}: StepDetailsProps) => {
  const { t } = useTranslation();
  const { showOverlay, hideOverlay } = useVisualization();

  const currentState = useMemo(() => {
    if (iterations.length === 0) return null;
    const idx = Math.min(currentIteration, iterations.length - 1);
    return iterations[idx];
  }, [iterations, currentIteration]);

  const nextState = useMemo(() => {
    if (iterations.length === 0) return null;
    const idx = Math.min(currentIteration + 1, iterations.length - 1);
    if (idx === currentIteration) return null;
    return iterations[idx];
  }, [iterations, currentIteration]);

  const formulas =
    methodFormulas[algorithmId as FormulaKey] ?? methodFormulas.steepestDescent;

  const createOverlayHandler = useCallback(
    (overlayType: OverlayData['type']) => ({
      onMouseEnter: () => {
        if (!currentState) return;
        const baseData = {
          type: overlayType,
          algorithmId,
          currentPoint: [currentState.x[0], currentState.x[1]] as readonly [number, number],
          gradient: [currentState.gradient[0], currentState.gradient[1]] as readonly [number, number],
          fx: currentState.fx,
        };

        const overlay: OverlayData = {
          ...baseData,
          ...(currentState.direction && {
            direction: [currentState.direction[0], currentState.direction[1]] as readonly [number, number],
          }),
          ...(nextState && {
            nextPoint: [nextState.x[0], nextState.x[1]] as readonly [number, number],
          }),
          // For trust region, estimate radius from direction norm
          ...(algorithmId === 'trustRegion' && currentState.direction && {
            trustRegionRadius: Math.sqrt(
              currentState.direction[0] ** 2 + currentState.direction[1] ** 2,
            ),
          }),
          // Include Hessian for quadratic model visualization
          ...(currentState.trueHessian && {
            hessian: currentState.trueHessian,
          }),
        };
        showOverlay(overlay);
      },
      onMouseLeave: hideOverlay,
    }),
    [currentState, nextState, algorithmId, showOverlay, hideOverlay],
  );

  if (!currentState) {
    return null;
  }

  const isInitialState = currentState.direction === null;

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ borderColor: color }}>
        <span className={styles.algorithmName}>
          {t(`optimizers.${algorithmId}.name`)}
        </span>
        <span className={styles.iterationBadge}>
          <InlineMath math={`k = ${currentIteration}`} />
        </span>
      </div>

      <div className={styles.formulaSection}>
        <div className={styles.formulaTitle}>{t('stepDetails.updateFormula')}</div>
        <div className={styles.formulaBlock}>
          <BlockMath math={formulas.direction} />
        </div>
        <div className={styles.formulaBlock}>
          <BlockMath math={formulas.update} />
        </div>
        {formulas.scalarUpdate && (
          <details className={styles.hessianUpdateDetails} open>
            <summary className={styles.hessianUpdateSummary}>
              <InlineMath math="\alpha_k" /> {t('stepDetails.updateRule')}
            </summary>
            <div className={styles.hessianUpdateFormula}>
              <BlockMath math={formulas.scalarUpdate} />
              <div className={styles.whereClause}>
                <InlineMath math="s_{k-1} = x_k - x_{k-1}" />
                <InlineMath math="y_{k-1} = \nabla f(x_k) - \nabla f(x_{k-1})" />
              </div>
              <div className={styles.bbExplanation}>
                {t('stepDetails.bbExplanation')}
              </div>
            </div>
          </details>
        )}
        {formulas.hessianUpdate && (
          <details className={styles.hessianUpdateDetails}>
            <summary className={styles.hessianUpdateSummary}>
              <InlineMath math="B_k" /> {t('stepDetails.updateRule')}
            </summary>
            <div className={styles.hessianUpdateFormula}>
              <BlockMath math={formulas.hessianUpdate} />
              <div className={styles.whereClause}>
                <InlineMath math="s_k = x_{k+1} - x_k" />
                <InlineMath math="y_k = \nabla f(x_{k+1}) - \nabla f(x_k)" />
                {algorithmId === 'bfgs' && (
                  <InlineMath math="\rho_k = \frac{1}{y_k^T s_k}" />
                )}
              </div>
            </div>
          </details>
        )}
        {formulas.qpSubproblem && (
          <details className={styles.hessianUpdateDetails} open>
            <summary className={styles.hessianUpdateSummary}>
              {t('stepDetails.qpSubproblem')}
            </summary>
            <div className={styles.hessianUpdateFormula}>
              <div
                className={styles.hoverable}
                {...createOverlayHandler('quadraticModel')}
                title={t('stepDetails.hoverHint')}
              >
                <BlockMath math={formulas.qpSubproblem} />
                <span className={styles.hoverHintInline}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </span>
              </div>
              <div className={styles.qpExplanation}>
                {t('stepDetails.qpExplanation')}
              </div>
            </div>
          </details>
        )}
        {formulas.trustRegionUpdate && (
          <details className={styles.hessianUpdateDetails} open>
            <summary className={styles.hessianUpdateSummary}>
              <InlineMath math="\Delta_k" /> {t('stepDetails.updateRule')}
            </summary>
            <div className={styles.hessianUpdateFormula}>
              <BlockMath math={formulas.trustRegionUpdate} />
              <div className={styles.whereClause}>
                <InlineMath math="\rho_k > 0.75 \text{ and on boundary} \Rightarrow \Delta_{k+1} = 2\Delta_k" />
                <InlineMath math="\rho_k < 0.25 \Rightarrow \Delta_{k+1} = 0.25\Delta_k" />
              </div>
              <div className={styles.trustRegionExplanation}>
                {t('stepDetails.trustRegionExplanation')}
              </div>
            </div>
          </details>
        )}
      </div>

      <div className={styles.valuesSection}>
        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>
            <InlineMath math="x_k" />
          </span>
          <div className={styles.valueData}>
            <InlineMath math={formatVectorLatex(currentState.x)} />
          </div>
        </div>

        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>
            <InlineMath math="f(x_k)" />
          </span>
          <code className={styles.valueCode}>{formatNumber(currentState.fx, 6)}</code>
        </div>

        <div
          className={`${styles.valueRow} ${styles.hoverable}`}
          title={t('stepDetails.hoverHint')}
          {...createOverlayHandler('gradient')}
        >
          <span className={styles.valueLabel}>
            <InlineMath math="\nabla f(x_k)" />
          </span>
          <div className={styles.valueData}>
            <InlineMath math={formatVectorLatex(currentState.gradient)} />
          </div>
          <span className={styles.hoverHint}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </span>
        </div>

        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>
            <InlineMath math="\|\nabla f\|" />
          </span>
          <code className={styles.valueCode}>
            {formatNumber(currentState.gradientNorm, 6)}
          </code>
        </div>

        {!isInitialState && currentState.direction && (
          <>
            <div className={styles.separator} />

            <div
              className={`${styles.valueRow} ${styles.hoverable}`}
              title={t('stepDetails.hoverHint')}
              {...createOverlayHandler('direction')}
            >
              <span className={styles.valueLabel}>
                <InlineMath math="d_k" />
              </span>
              <div className={styles.valueData}>
                <InlineMath math={formatVectorLatex(currentState.direction)} />
              </div>
              <span className={styles.hoverHint}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </span>
            </div>

            <div className={styles.valueRow}>
              <span className={styles.valueLabel}>
                <InlineMath math="\alpha_k" />
              </span>
              <code className={styles.valueCode}>
                {currentState.alpha !== null
                  ? formatNumber(currentState.alpha, 6)
                  : '-'}
              </code>
              <Tooltip content={t('stepDetails.alphaDesc')}>?</Tooltip>
            </div>
          </>
        )}

        {nextState && (
          <>
            <div className={styles.separator} />

            <div
              className={`${styles.valueRow} ${styles.hoverable}`}
              title={t('stepDetails.hoverHint')}
              {...createOverlayHandler('nextPoint')}
            >
              <span className={styles.valueLabel}>
                <InlineMath math="x_{k+1}" />
              </span>
              <div className={styles.valueData}>
                <InlineMath math={formatVectorLatex(nextState.x)} />
              </div>
              <span className={styles.hoverHint}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </span>
            </div>

            <div className={styles.valueRow}>
              <span className={styles.valueLabel}>
                <InlineMath math="f(x_{k+1})" />
              </span>
              <code className={styles.valueCode}>{formatNumber(nextState.fx, 6)}</code>
            </div>

            <div className={styles.improvement}>
              <span className={styles.improvementLabel}>
                {t('stepDetails.improvement')}
              </span>
              <code className={styles.improvementValue}>
                <InlineMath
                  math={`\\Delta f = ${formatNumber(nextState.fx - currentState.fx, 6)}`}
                />
              </code>
            </div>
          </>
        )}
      </div>

      {(algorithmId === 'bfgs' || algorithmId === 'dfp' || algorithmId === 'sr1') && (
        <div className={styles.hessianNote}>
          <InlineMath math="B_k \approx H^{-1}" />
          <span className={styles.hessianNoteText}>
            {t('stepDetails.seeMatrixComparison')}
          </span>
        </div>
      )}

      {func && (
        <LineSearchChart
          func={func}
          iteration={currentState}
          color={color}
        />
      )}

      <SecantCondition
        iterations={iterations}
        currentIteration={currentIteration}
        algorithmId={algorithmId}
      />
    </div>
  );
};
