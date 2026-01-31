import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { IterationState } from '@/core/optimizers/types.ts';
import styles from './StepDetails.module.css';

interface StepDetailsProps {
  readonly algorithmId: string;
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly color: string;
}

const formatNumber = (n: number, precision = 4): string => {
  if (Math.abs(n) < 0.0001 && n !== 0) {
    return n.toExponential(2);
  }
  return n.toFixed(precision);
};

const formatVector = (v: readonly number[], precision = 4): string => {
  return `[${v.map((x) => formatNumber(x, precision)).join(', ')}]`;
};

type FormulaKey =
  | 'steepestDescent'
  | 'newton'
  | 'bfgs'
  | 'dfp'
  | 'sr1';

const methodFormulas: Record<FormulaKey, {
  readonly direction: string;
  readonly directionDesc: string;
  readonly update: string;
}> = {
  steepestDescent: {
    direction: 'd = -∇f(x)',
    directionDesc: 'Negative gradient (steepest descent direction)',
    update: 'x_{k+1} = x_k + α_k · d_k',
  },
  newton: {
    direction: 'd = -H⁻¹ · ∇f(x)',
    directionDesc: 'Newton direction using true inverse Hessian',
    update: 'x_{k+1} = x_k + α_k · d_k',
  },
  bfgs: {
    direction: 'd = -B_k · ∇f(x)',
    directionDesc: 'Quasi-Newton direction using BFGS approximation B_k ≈ H⁻¹',
    update: 'x_{k+1} = x_k + α_k · d_k',
  },
  dfp: {
    direction: 'd = -B_k · ∇f(x)',
    directionDesc: 'Quasi-Newton direction using DFP approximation B_k ≈ H⁻¹',
    update: 'x_{k+1} = x_k + α_k · d_k',
  },
  sr1: {
    direction: 'd = -B_k · ∇f(x)',
    directionDesc: 'Quasi-Newton direction using SR1 approximation B_k ≈ H⁻¹',
    update: 'x_{k+1} = x_k + α_k · d_k',
  },
};

export const StepDetails = ({
  algorithmId,
  iterations,
  currentIteration,
  color,
}: StepDetailsProps) => {
  const { t } = useTranslation();

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

  const formulas = methodFormulas[algorithmId as FormulaKey] ?? methodFormulas.steepestDescent;

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
          k = {currentIteration}
        </span>
      </div>

      <div className={styles.formulaSection}>
        <div className={styles.formulaTitle}>{t('stepDetails.updateFormula')}</div>
        <div className={styles.formulaRow}>
          <code className={styles.formula}>{formulas.direction}</code>
          <span className={styles.tooltip} data-tooltip={formulas.directionDesc}>?</span>
        </div>
        <div className={styles.formulaRow}>
          <code className={styles.formula}>{formulas.update}</code>
          <span
            className={styles.tooltip}
            data-tooltip={t('stepDetails.lineSearchDesc')}
          >?</span>
        </div>
      </div>

      <div className={styles.valuesSection}>
        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>
            x<sub>k</sub>
          </span>
          <code className={styles.valueData}>{formatVector(currentState.x)}</code>
        </div>

        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>
            f(x<sub>k</sub>)
          </span>
          <code className={styles.valueData}>{formatNumber(currentState.fx, 6)}</code>
        </div>

        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>
            ∇f(x<sub>k</sub>)
          </span>
          <code className={styles.valueData}>{formatVector(currentState.gradient)}</code>
        </div>

        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>
            ‖∇f‖
          </span>
          <code className={styles.valueData}>{formatNumber(currentState.gradientNorm, 6)}</code>
        </div>

        {!isInitialState && currentState.direction && (
          <>
            <div className={styles.separator} />

            <div className={styles.valueRow}>
              <span className={styles.valueLabel}>
                d<sub>k</sub>
              </span>
              <code className={styles.valueData}>{formatVector(currentState.direction)}</code>
            </div>

            <div className={styles.valueRow}>
              <span className={styles.valueLabel}>
                α<sub>k</sub>
              </span>
              <code className={styles.valueData}>
                {currentState.alpha !== null ? formatNumber(currentState.alpha, 6) : '-'}
              </code>
              <span
                className={styles.tooltip}
                data-tooltip={t('stepDetails.alphaDesc')}
              >?</span>
            </div>
          </>
        )}

        {nextState && (
          <>
            <div className={styles.separator} />

            <div className={styles.valueRow}>
              <span className={styles.valueLabel}>
                x<sub>k+1</sub>
              </span>
              <code className={styles.valueData}>{formatVector(nextState.x)}</code>
            </div>

            <div className={styles.valueRow}>
              <span className={styles.valueLabel}>
                f(x<sub>k+1</sub>)
              </span>
              <code className={styles.valueData}>{formatNumber(nextState.fx, 6)}</code>
            </div>

            <div className={styles.improvement}>
              <span className={styles.improvementLabel}>{t('stepDetails.improvement')}</span>
              <code className={styles.improvementValue}>
                Δf = {formatNumber(nextState.fx - currentState.fx, 6)}
              </code>
            </div>
          </>
        )}
      </div>

      {(algorithmId === 'bfgs' || algorithmId === 'dfp' || algorithmId === 'sr1') && (
        <div className={styles.hessianNote}>
          <span className={styles.tooltip} data-tooltip={t('stepDetails.hessianApproxDesc')}>
            B<sub>k</sub> ≈ H⁻¹
          </span>
          <span className={styles.hessianNoteText}>
            {t('stepDetails.seeMatrixComparison')}
          </span>
        </div>
      )}
    </div>
  );
};
