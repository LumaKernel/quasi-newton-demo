import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
] as const;

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  return (
    <div className={styles.container}>
      <span className={styles.label}>{t('language.label')}</span>
      <div className={styles.buttons}>
        {languages.map(({ code, label }) => (
          <button
            key={code}
            className={`${styles.button} ${i18n.language.startsWith(code) ? styles.active : ''}`}
            onClick={() => i18n.changeLanguage(code)}
            disabled={i18n.language.startsWith(code)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
