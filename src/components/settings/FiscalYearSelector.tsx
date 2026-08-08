import { useTranslation } from 'react-i18next';
import styles from './CurrencySelector.module.css';

interface FiscalYearSelectorProps {
  value: number;
  onChange: (month: number) => void;
}

export const FiscalYearSelector = ({ value, onChange }: FiscalYearSelectorProps) => {
  const { t } = useTranslation();
  const mode = value === 1 ? 'calendar_year' : value === 7 ? 'australia' : 'custom';
  const months = t('months', { returnObjects: true }) as unknown as string[];

  return (
    <div className={styles.group} role="radiogroup" aria-label={t('settings.financial_year')}>
      <label className={styles.option}>
        <input type="radio" checked={mode === 'calendar_year'} onChange={() => onChange(1)} />
        {t('fiscal_year.calendar_year')}
      </label>
      <label className={styles.option}>
        <input type="radio" checked={mode === 'australia'} onChange={() => onChange(7)} />
        {t('fiscal_year.australia')}
      </label>
      <label className={styles.option}>
        <input type="radio" checked={mode === 'custom'} onChange={() => onChange(4)} />
        {t('fiscal_year.custom')}
        {mode === 'custom' && (
          <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
            {months.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        )}
      </label>
    </div>
  );
};
