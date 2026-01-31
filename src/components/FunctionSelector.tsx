import { useTranslation } from 'react-i18next';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import { allFunctions } from '@/core/functions/index.ts';
import styles from './FunctionSelector.module.css';

interface FunctionSelectorProps {
  readonly selectedId: string;
  readonly onSelect: (func: ObjectiveFunction) => void;
}

export const FunctionSelector = ({
  selectedId,
  onSelect,
}: FunctionSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <label className={styles.label}>{t('controls.objectiveFunction')}</label>
      <select
        className={styles.select}
        value={selectedId}
        onChange={(e) => {
          const func = allFunctions.find((f) => f.id === e.target.value);
          if (func) onSelect(func);
        }}
      >
        {allFunctions.map((func) => (
          <option key={func.id} value={func.id}>
            {t(`functions.${func.id}.name`)}
          </option>
        ))}
      </select>
      <p className={styles.description}>
        {t(`functions.${selectedId}.description`)}
      </p>
    </div>
  );
};
