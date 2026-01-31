import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import styles from './EigenvalueAnalysis.module.css';

interface EigenvalueAnalysisProps {
  readonly trueHessian: readonly (readonly number[])[] | null;
  readonly approximateInverseHessian: readonly (readonly number[])[] | null;
  readonly iteration: number;
}

interface Eigendata {
  readonly eigenvalues: readonly [number, number];
  readonly eigenvectors: readonly [readonly [number, number], readonly [number, number]];
  readonly conditionNumber: number;
}

// Compute eigenvalues and eigenvectors for a 2x2 symmetric matrix
const computeEigendata = (matrix: readonly (readonly number[])[]): Eigendata | null => {
  if (matrix.length !== 2 || matrix[0].length !== 2) return null;

  const a = matrix[0][0];
  const b = matrix[0][1];
  const d = matrix[1][1];

  // For symmetric 2x2 matrix [[a, b], [b, d]]
  // Eigenvalues: λ = (a + d)/2 ± sqrt(((a-d)/2)² + b²)
  const trace = a + d;
  const det = a * d - b * b;
  const discriminant = trace * trace - 4 * det;

  if (discriminant < 0) {
    // Complex eigenvalues (shouldn't happen for symmetric matrices, but handle edge case)
    return null;
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  // Compute eigenvectors
  // For eigenvalue λ, solve (A - λI)v = 0
  const computeEigenvector = (lambda: number): readonly [number, number] => {
    const row1 = [a - lambda, b];
    // v = [-b, a - lambda] normalized, or use null space of first row
    if (Math.abs(row1[0]) > 1e-10 || Math.abs(row1[1]) > 1e-10) {
      const v = [-row1[1], row1[0]];
      const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      if (norm > 1e-10) {
        return [v[0] / norm, v[1] / norm];
      }
    }
    return [1, 0]; // fallback
  };

  const v1 = computeEigenvector(lambda1);
  const v2 = computeEigenvector(lambda2);

  // Condition number = |λ_max| / |λ_min|
  const absLambda1 = Math.abs(lambda1);
  const absLambda2 = Math.abs(lambda2);
  const conditionNumber =
    Math.min(absLambda1, absLambda2) > 1e-10
      ? Math.max(absLambda1, absLambda2) / Math.min(absLambda1, absLambda2)
      : Infinity;

  return {
    eigenvalues: [lambda1, lambda2],
    eigenvectors: [v1, v2],
    conditionNumber,
  };
};

// Invert a 2x2 matrix
const invertMatrix2x2 = (
  matrix: readonly (readonly number[])[],
): readonly (readonly number[])[] | null => {
  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[1][0];
  const d = matrix[1][1];
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-10) return null;
  return [
    [d / det, -b / det],
    [-c / det, a / det],
  ];
};

const formatNumber = (n: number): string => {
  if (!isFinite(n)) return '∞';
  if (Math.abs(n) < 0.001 && n !== 0) return n.toExponential(2);
  return n.toFixed(4);
};

const EigenvalueBar = ({
  value,
  maxValue,
  color,
  label,
}: {
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
  readonly label: string;
}) => {
  const width = isFinite(value) && maxValue > 0 ? Math.min(Math.abs(value) / maxValue, 1) * 100 : 0;
  const isNegative = value < 0;

  return (
    <div className={styles.eigenvalueBar}>
      <span className={styles.eigenvalueLabel}>{label}</span>
      <div className={styles.barContainer}>
        {isNegative && <div className={styles.negativeZone} style={{ width: `${width}%` }} />}
        <div
          className={styles.bar}
          style={{
            width: `${width}%`,
            backgroundColor: color,
            marginLeft: isNegative ? 'auto' : 0,
          }}
        />
      </div>
      <span className={styles.eigenvalueValue}>{formatNumber(value)}</span>
    </div>
  );
};

export const EigenvalueAnalysis = ({
  trueHessian,
  approximateInverseHessian,
  iteration,
}: EigenvalueAnalysisProps) => {
  const { t } = useTranslation();

  const trueHessianEigen = useMemo(() => {
    if (!trueHessian) return null;
    return computeEigendata(trueHessian);
  }, [trueHessian]);

  const trueInverseHessianEigen = useMemo(() => {
    if (!trueHessian) return null;
    const invH = invertMatrix2x2(trueHessian);
    if (!invH) return null;
    return computeEigendata(invH);
  }, [trueHessian]);

  const approxInverseEigen = useMemo(() => {
    if (!approximateInverseHessian) return null;
    return computeEigendata(approximateInverseHessian);
  }, [approximateInverseHessian]);

  if (!trueHessianEigen) {
    return null;
  }

  // Find max eigenvalue for scaling bars
  const allEigenvalues = [
    ...trueHessianEigen.eigenvalues,
    ...(trueInverseHessianEigen?.eigenvalues ?? []),
    ...(approxInverseEigen?.eigenvalues ?? []),
  ].filter(isFinite);
  const maxEigenvalue = Math.max(...allEigenvalues.map(Math.abs), 1);

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>
        {t('eigenvalue.title', { iteration })}
      </h4>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <InlineMath math="H" /> - {t('eigenvalue.trueHessian')}
        </div>
        <EigenvalueBar
          value={trueHessianEigen.eigenvalues[0]}
          maxValue={maxEigenvalue}
          color="#3498db"
          label="λ₁"
        />
        <EigenvalueBar
          value={trueHessianEigen.eigenvalues[1]}
          maxValue={maxEigenvalue}
          color="#2980b9"
          label="λ₂"
        />
        <div className={styles.conditionNumber}>
          <span>{t('eigenvalue.conditionNumber')}:</span>
          <code>{formatNumber(trueHessianEigen.conditionNumber)}</code>
        </div>
      </div>

      {trueInverseHessianEigen && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <InlineMath math="H^{-1}" /> - {t('eigenvalue.trueInverse')}
          </div>
          <EigenvalueBar
            value={trueInverseHessianEigen.eigenvalues[0]}
            maxValue={maxEigenvalue}
            color="#27ae60"
            label="λ₁"
          />
          <EigenvalueBar
            value={trueInverseHessianEigen.eigenvalues[1]}
            maxValue={maxEigenvalue}
            color="#1e8449"
            label="λ₂"
          />
        </div>
      )}

      {approxInverseEigen && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <InlineMath math="B_k" /> - {t('eigenvalue.approxInverse')}
          </div>
          <EigenvalueBar
            value={approxInverseEigen.eigenvalues[0]}
            maxValue={maxEigenvalue}
            color="#e67e22"
            label="λ₁"
          />
          <EigenvalueBar
            value={approxInverseEigen.eigenvalues[1]}
            maxValue={maxEigenvalue}
            color="#d35400"
            label="λ₂"
          />
          <div className={styles.conditionNumber}>
            <span>{t('eigenvalue.conditionNumber')}:</span>
            <code>{formatNumber(approxInverseEigen.conditionNumber)}</code>
          </div>
        </div>
      )}

      <div className={styles.explanation}>
        <p>{t('eigenvalue.explanation')}</p>
      </div>
    </div>
  );
};
