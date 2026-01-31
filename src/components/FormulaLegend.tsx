import { useTranslation } from 'react-i18next';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Tooltip } from '@/components/Tooltip.tsx';
import styles from './FormulaLegend.module.css';

interface FormulaItem {
  readonly symbol: string;
  readonly nameKey: string;
  readonly descKey: string;
  readonly formula?: string;
}

const formulaItems: readonly FormulaItem[] = [
  { symbol: 'x_k', nameKey: 'formulaLegend.xk.name', descKey: 'formulaLegend.xk.desc' },
  { symbol: '\\nabla f(x_k)', nameKey: 'formulaLegend.grad.name', descKey: 'formulaLegend.grad.desc' },
  { symbol: 'd_k', nameKey: 'formulaLegend.dk.name', descKey: 'formulaLegend.dk.desc', formula: 'd_k = -B_k \\nabla f(x_k)' },
  { symbol: '\\alpha_k', nameKey: 'formulaLegend.alpha.name', descKey: 'formulaLegend.alpha.desc' },
  { symbol: 'H', nameKey: 'formulaLegend.H.name', descKey: 'formulaLegend.H.desc', formula: 'H_{ij} = \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}' },
  { symbol: 'B_k', nameKey: 'formulaLegend.Bk.name', descKey: 'formulaLegend.Bk.desc', formula: 'B_k \\approx H^{-1}' },
  { symbol: 's_k', nameKey: 'formulaLegend.sk.name', descKey: 'formulaLegend.sk.desc', formula: 's_k = x_{k+1} - x_k' },
  { symbol: 'y_k', nameKey: 'formulaLegend.yk.name', descKey: 'formulaLegend.yk.desc', formula: 'y_k = \\nabla f_{k+1} - \\nabla f_k' },
  { symbol: '\\Delta_k', nameKey: 'formulaLegend.Delta.name', descKey: 'formulaLegend.Delta.desc' },
  { symbol: '\\rho_k', nameKey: 'formulaLegend.rho.name', descKey: 'formulaLegend.rho.desc', formula: '\\rho_k = \\frac{f_k - f_{k+1}}{m_k(0) - m_k(d_k)}' },
];

export const FormulaLegend = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>{t('formulaLegend.title')}</h4>
      <p className={styles.hint}>{t('formulaLegend.hint')}</p>
      <div className={styles.grid}>
        {formulaItems.map((item) => (
          <Tooltip key={item.symbol} content={t(item.descKey)}>
            <div className={styles.item}>
              <span className={styles.symbol}>
                <InlineMath math={item.symbol} />
              </span>
              <span className={styles.name}>{t(item.nameKey)}</span>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
