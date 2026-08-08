import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '../../utils/currencies';
import styles from './CurrencySelector.module.css';

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  hasExistingData: boolean;
}

export const CurrencySelector = ({ value, onChange, hasExistingData }: CurrencySelectorProps) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<CurrencyCode | null>(null);

  const handleSelect = (code: CurrencyCode) => {
    if (code === value) return;
    if (hasExistingData) {
      setPending(code);
    } else {
      onChange(code);
    }
  };

  return (
    <div className={styles.group}>
      <select
        className={styles.select}
        aria-label={t('settings.currency')}
        value={pending ?? value}
        onChange={(e) => handleSelect(e.target.value as CurrencyCode)}
      >
        {SUPPORTED_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {t(`currency.${code}`)}
          </option>
        ))}
      </select>

      {pending && (
        <div className={styles.warning}>
          <p className={styles.warningText}>{t('settings.currency_change_warning')}</p>
          <Button
            onClick={() => {
              onChange(pending);
              setPending(null);
            }}
          >
            {t('common.confirm')}
          </Button>
          <Button variant="outline" onClick={() => setPending(null)}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
};
