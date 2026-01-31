import { useTranslation } from 'react-i18next';
import type { OptimizationResult } from '@/core/optimizers/types.ts';
import { algorithmColors } from './AlgorithmSelector.tsx';
import styles from './ComparisonPanel.module.css';

interface ComparisonPanelProps {
  readonly results: ReadonlyMap<string, OptimizationResult>;
}

export const ComparisonPanel = ({ results }: ComparisonPanelProps) => {
  const { t } = useTranslation();

  if (results.size === 0) {
    return (
      <div className={styles.empty}>
        {t('comparison.empty')}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('comparison.title')}</h3>
      <div className={styles.table}>
        <div className={styles.header}>
          <span>{t('comparison.algorithm')}</span>
          <span>{t('comparison.iterations')}</span>
          <span>{t('comparison.finalValue')}</span>
          <span>{t('comparison.converged')}</span>
        </div>
        {Array.from(results.entries()).map(([id, result]) => (
          <div key={id} className={styles.row}>
            <span className={styles.algorithmName}>
              <span
                className={styles.colorDot}
                style={{ background: algorithmColors[id] }}
              />
              {id.toUpperCase()}
            </span>
            <span className={styles.value}>{result.iterations.length - 1}</span>
            <span className={styles.value}>{result.finalValue.toExponential(4)}</span>
            <span className={`${styles.status} ${result.converged ? styles.converged : styles.notConverged}`}>
              {result.converged ? '✓' : '✗'}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.stats}>
        <h4>{t('comparison.detailedStats')}</h4>
        {Array.from(results.entries()).map(([id, result]) => {
          const lastIter = result.iterations[result.iterations.length - 1];
          return (
            <div key={id} className={styles.statBlock}>
              <div className={styles.statHeader}>
                <span
                  className={styles.colorDot}
                  style={{ background: algorithmColors[id] }}
                />
                {id.toUpperCase()}
              </div>
              <div className={styles.statGrid}>
                <span>{t('comparison.solution')}:</span>
                <span>({lastIter.x.map((v) => v.toFixed(4)).join(', ')})</span>
                <span>{t('comparison.gradientNorm')}:</span>
                <span>{lastIter.gradientNorm.toExponential(4)}</span>
                <span>{t('comparison.functionEvals')}:</span>
                <span>{result.functionEvaluations}</span>
                <span>{t('comparison.gradientEvals')}:</span>
                <span>{result.gradientEvaluations}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
