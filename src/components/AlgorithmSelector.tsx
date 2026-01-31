import { useTranslation } from 'react-i18next';
import type { OptimizerInfo } from '@/core/optimizers/types.ts';
import { allOptimizers } from '@/core/optimizers/index.ts';
import styles from './AlgorithmSelector.module.css';

interface AlgorithmSelectorProps {
  readonly selectedIds: readonly string[];
  readonly onToggle: (optimizer: OptimizerInfo) => void;
}

const algorithmColors: Record<string, string> = {
  steepestDescent: '#f39c12',
  bb: '#16a085',
  newton: '#e74c3c',
  trustRegion: '#c0392b',
  bfgs: '#3498db',
  dfp: '#27ae60',
  sr1: '#9b59b6',
};

export const AlgorithmSelector = ({
  selectedIds,
  onToggle,
}: AlgorithmSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <label className={styles.label}>{t('controls.algorithms')}</label>
      <div className={styles.options}>
        {allOptimizers.map((opt) => (
          <label
            key={opt.id}
            className={`${styles.option} ${selectedIds.includes(opt.id) ? styles.selected : ''}`}
            style={{
              borderColor: selectedIds.includes(opt.id)
                ? algorithmColors[opt.id]
                : undefined,
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(opt.id)}
              onChange={() => onToggle(opt)}
              className={styles.checkbox}
            />
            <span
              className={styles.colorDot}
              style={{ background: algorithmColors[opt.id] }}
            />
            <span className={styles.name}>{t(`optimizers.${opt.id}.name`)}</span>
            {opt.usesTrueHessian && (
              <span className={styles.badge}>{t('controls.trueHessian')}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

export { algorithmColors };
