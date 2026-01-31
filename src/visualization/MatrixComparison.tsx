import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HessianView } from './HessianView.tsx';
import type { Matrix } from '@/core/linalg/types.ts';
import { sub as matSub, frobeniusNorm, inverse } from '@/core/linalg/matrix.ts';
import styles from './MatrixComparison.module.css';

interface MatrixComparisonProps {
  readonly trueHessian: Matrix;
  readonly approximateInverseHessian: Matrix;
  readonly iteration: number;
}

export const MatrixComparison = ({
  trueHessian,
  approximateInverseHessian,
  iteration,
}: MatrixComparisonProps) => {
  const { t } = useTranslation();

  const trueInverseHessian = useMemo(() => {
    const inv = inverse(trueHessian);
    return inv ?? trueHessian.map((row) => row.map(() => NaN));
  }, [trueHessian]);

  const difference = useMemo(() => {
    try {
      return matSub(approximateInverseHessian, trueInverseHessian);
    } catch {
      return approximateInverseHessian.map((row) => row.map(() => 0));
    }
  }, [approximateInverseHessian, trueInverseHessian]);

  const frobeniusError = useMemo(() => frobeniusNorm(difference), [difference]);

  const relativeError = useMemo(() => {
    const trueNorm = frobeniusNorm(trueInverseHessian);
    return trueNorm > 0 ? frobeniusError / trueNorm : Infinity;
  }, [frobeniusError, trueInverseHessian]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('hessian.title', { iteration })}</h3>

      <div className={styles.matrices}>
        <div className={styles.matrixItem}>
          <HessianView
            matrix={trueHessian}
            title={t('hessian.trueHessian')}
            colorScheme="diverging"
          />
        </div>

        <div className={styles.matrixItem}>
          <HessianView
            matrix={trueInverseHessian}
            title={t('hessian.trueInverse')}
            colorScheme="diverging"
          />
        </div>

        <div className={styles.matrixItem}>
          <HessianView
            matrix={approximateInverseHessian}
            title={t('hessian.approxInverse')}
            colorScheme="diverging"
          />
        </div>

        <div className={styles.matrixItem}>
          <HessianView
            matrix={difference}
            title={t('hessian.error')}
            colorScheme="diverging"
          />
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t('hessian.frobeniusError')}:</span>
          <span className={styles.metricValue}>{frobeniusError.toFixed(6)}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t('hessian.relativeError')}:</span>
          <span className={styles.metricValue}>
            {(relativeError * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className={styles.explanation}>
        <p>
          <strong>{t('hessian.trueHessian')}:</strong> {t('hessian.explanation.trueHessian')}
        </p>
        <p>
          <strong>{t('hessian.approxInverse')}:</strong> {t('hessian.explanation.approxInverse')}
        </p>
        <p>
          {t('hessian.explanation.convergence')}
        </p>
      </div>
    </div>
  );
};
