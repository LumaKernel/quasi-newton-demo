import { useTranslation } from 'react-i18next';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import styles from './FormulaLegend.module.css';

const symbols = [
  { latex: 'x_k', nameKey: 'formulaLegend.xk.name', descKey: 'formulaLegend.xk.desc' },
  { latex: '\\nabla f', nameKey: 'formulaLegend.grad.name', descKey: 'formulaLegend.grad.desc' },
  { latex: 'd_k', nameKey: 'formulaLegend.dk.name', descKey: 'formulaLegend.dk.desc' },
  { latex: '\\alpha_k', nameKey: 'formulaLegend.alpha.name', descKey: 'formulaLegend.alpha.desc' },
  { latex: 'H', nameKey: 'formulaLegend.H.name', descKey: 'formulaLegend.H.desc' },
  { latex: 'B_k', nameKey: 'formulaLegend.Bk.name', descKey: 'formulaLegend.Bk.desc' },
  { latex: 's_k', nameKey: 'formulaLegend.sk.name', descKey: 'formulaLegend.sk.desc' },
  { latex: 'y_k', nameKey: 'formulaLegend.yk.name', descKey: 'formulaLegend.yk.desc' },
  { latex: '\\Delta_k', nameKey: 'formulaLegend.Delta.name', descKey: 'formulaLegend.Delta.desc' },
  { latex: '\\rho_k', nameKey: 'formulaLegend.rho.name', descKey: 'formulaLegend.rho.desc' },
] as const;

export const FormulaLegend = () => {
  const { t } = useTranslation();

  return (
    <details className={styles.container}>
      <summary className={styles.title}>{t('formulaLegend.title')}</summary>
      <div className={styles.list}>
        {symbols.map((item) => (
          <div key={item.latex} className={styles.item}>
            <div className={styles.symbolRow}>
              <span className={styles.symbol}>
                <InlineMath math={item.latex} />
              </span>
              <span className={styles.name}>{t(item.nameKey)}</span>
            </div>
            <p className={styles.desc}>{t(item.descKey)}</p>
          </div>
        ))}
      </div>
    </details>
  );
};
