import { useTranslation } from 'react-i18next';
import styles from './ViewModeToggle.module.css';

type ViewMode = '2d' | '3d';

interface ViewModeToggleProps {
  readonly value: ViewMode;
  readonly onChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ value, onChange }: ViewModeToggleProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <label className={styles.label}>{t('visualization.viewMode')}</label>
      <div className={styles.buttons}>
        <button
          className={`${styles.button} ${value === '2d' ? styles.active : ''}`}
          onClick={() => onChange('2d')}
          disabled={value === '2d'}
        >
          {t('visualization.view2D')}
        </button>
        <button
          className={`${styles.button} ${value === '3d' ? styles.active : ''}`}
          onClick={() => onChange('3d')}
          disabled={value === '3d'}
        >
          {t('visualization.view3D')}
        </button>
      </div>
    </div>
  );
};
