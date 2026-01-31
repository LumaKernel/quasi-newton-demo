import { useTranslation } from 'react-i18next';
import { Tooltip } from '@/components/Tooltip.tsx';
import styles from './FormulaLegend.module.css';

const symbols = [
  { symbol: 'xₖ', nameKey: 'formulaLegend.xk.name', descKey: 'formulaLegend.xk.desc' },
  { symbol: '∇f', nameKey: 'formulaLegend.grad.name', descKey: 'formulaLegend.grad.desc' },
  { symbol: 'dₖ', nameKey: 'formulaLegend.dk.name', descKey: 'formulaLegend.dk.desc' },
  { symbol: 'αₖ', nameKey: 'formulaLegend.alpha.name', descKey: 'formulaLegend.alpha.desc' },
  { symbol: 'H', nameKey: 'formulaLegend.H.name', descKey: 'formulaLegend.H.desc' },
  { symbol: 'Bₖ', nameKey: 'formulaLegend.Bk.name', descKey: 'formulaLegend.Bk.desc' },
  { symbol: 'sₖ', nameKey: 'formulaLegend.sk.name', descKey: 'formulaLegend.sk.desc' },
  { symbol: 'yₖ', nameKey: 'formulaLegend.yk.name', descKey: 'formulaLegend.yk.desc' },
  { symbol: 'Δₖ', nameKey: 'formulaLegend.Delta.name', descKey: 'formulaLegend.Delta.desc' },
  { symbol: 'ρₖ', nameKey: 'formulaLegend.rho.name', descKey: 'formulaLegend.rho.desc' },
] as const;

export const FormulaLegend = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>{t('formulaLegend.title')}</h4>
      <div className={styles.list}>
        {symbols.map((item) => (
          <Tooltip key={item.symbol} content={t(item.descKey)}>
            <span className={styles.item}>
              <span className={styles.symbol}>{item.symbol}</span>
              <span className={styles.name}>{t(item.nameKey)}</span>
            </span>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
