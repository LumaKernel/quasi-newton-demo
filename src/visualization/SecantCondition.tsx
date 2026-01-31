import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { IterationState } from '@/core/optimizers/types.ts';
import styles from './SecantCondition.module.css';

interface SecantConditionProps {
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly algorithmId: string;
}

const formatNumber = (n: number, precision = 4): string => {
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(2);
  return n.toFixed(precision);
};

const vectorNorm = (v: readonly number[]): number =>
  Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));

const vectorDot = (a: readonly number[], b: readonly number[]): number =>
  a.reduce((sum, _, i) => sum + a[i] * b[i], 0);

// Multiply matrix by vector
const matVec = (
  M: readonly (readonly number[])[],
  v: readonly number[],
): number[] => M.map((row) => row.reduce((sum, val, j) => sum + val * v[j], 0));

export const SecantCondition = ({
  iterations,
  currentIteration,
  algorithmId,
}: SecantConditionProps) => {
  const { t } = useTranslation();

  const secantData = useMemo(() => {
    if (currentIteration < 1 || currentIteration >= iterations.length) {
      return null;
    }

    const curr = iterations[currentIteration];
    const prev = iterations[currentIteration - 1];

    if (!curr || !prev) return null;

    // s_k = x_{k+1} - x_k (computed from prev to curr)
    // y_k = ∇f(x_{k+1}) - ∇f(x_k)
    const s = curr.x.map((val, i) => val - prev.x[i]);
    const y = curr.gradient.map((val, i) => val - prev.gradient[i]);

    const sNorm = vectorNorm(s);
    const yNorm = vectorNorm(y);

    // Check if Hessian approximation satisfies B*y ≈ s
    // For inverse Hessian approximation B ≈ H^{-1}: B*y should equal s
    let Bs: number[] | null = null;
    let error = Infinity;
    let relativeError = Infinity;

    if (curr.hessianApprox) {
      Bs = matVec(curr.hessianApprox, y);
      const diff = Bs.map((val, i) => val - s[i]);
      error = vectorNorm(diff);
      relativeError = sNorm > 1e-10 ? error / sNorm : Infinity;
    }

    // Curvature condition: y^T s > 0 (required for BFGS)
    const yTs = vectorDot(y, s);
    const curvatureOk = yTs > 0;

    return {
      s,
      y,
      Bs,
      sNorm,
      yNorm,
      error,
      relativeError,
      yTs,
      curvatureOk,
    };
  }, [iterations, currentIteration]);

  // Only show for quasi-Newton methods
  if (!['bfgs', 'dfp', 'sr1', 'bb'].includes(algorithmId)) {
    return null;
  }

  if (!secantData) {
    return (
      <div className={styles.container}>
        <h4 className={styles.title}>{t('secant.title')}</h4>
        <p className={styles.empty}>{t('secant.noData')}</p>
      </div>
    );
  }

  const { s, y, Bs, sNorm, yNorm, error, relativeError, yTs, curvatureOk } = secantData;

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>{t('secant.title')}</h4>

      <div className={styles.formula}>
        <BlockMath math="B_{k} y_{k-1} = s_{k-1}" />
        <p className={styles.formulaDesc}>{t('secant.description')}</p>
      </div>

      <div className={styles.vectors}>
        <div className={styles.vectorItem}>
          <span className={styles.vectorLabel}>
            <InlineMath math="s_{k-1}" />
          </span>
          <span className={styles.vectorValue}>
            ({s.map((v) => formatNumber(v)).join(', ')})
          </span>
          <span className={styles.vectorNorm}>
            <InlineMath math={`\\|s\\| = ${formatNumber(sNorm)}`} />
          </span>
        </div>

        <div className={styles.vectorItem}>
          <span className={styles.vectorLabel}>
            <InlineMath math="y_{k-1}" />
          </span>
          <span className={styles.vectorValue}>
            ({y.map((v) => formatNumber(v)).join(', ')})
          </span>
          <span className={styles.vectorNorm}>
            <InlineMath math={`\\|y\\| = ${formatNumber(yNorm)}`} />
          </span>
        </div>

        {Bs && (
          <div className={styles.vectorItem}>
            <span className={styles.vectorLabel}>
              <InlineMath math="B_k y_{k-1}" />
            </span>
            <span className={styles.vectorValue}>
              ({Bs.map((v) => formatNumber(v)).join(', ')})
            </span>
          </div>
        )}
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t('secant.error')}</span>
          <code className={styles.metricValue}>{formatNumber(error, 6)}</code>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t('secant.relativeError')}</span>
          <code className={styles.metricValue}>
            {isFinite(relativeError) ? `${(relativeError * 100).toFixed(2)}%` : '—'}
          </code>
        </div>

        <div className={`${styles.metric} ${curvatureOk ? styles.ok : styles.warning}`}>
          <span className={styles.metricLabel}>
            <InlineMath math="y^T s" /> ({t('secant.curvature')})
          </span>
          <code className={styles.metricValue}>
            {formatNumber(yTs)} {curvatureOk ? '✓' : '✗'}
          </code>
        </div>
      </div>

      <div className={styles.explanation}>
        <p>{t('secant.explanation')}</p>
      </div>
    </div>
  );
};
