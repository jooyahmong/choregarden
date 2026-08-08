import { useTranslation } from 'react-i18next';
import { useFamily } from '../../contexts/FamilyContext';
import { formatCurrency, localeForLanguage } from '../../utils/formatting';
import { DEFAULT_CURRENCY, type CurrencyCode } from '../../utils/currencies';
import styles from './FlowerProgress.module.css';

export const FlowerProgress = ({
  progressCents,
  thresholdCents,
}: {
  progressCents: number;
  thresholdCents: number;
}) => {
  const { t, i18n } = useTranslation();
  const { family } = useFamily();
  const currency = (family?.currencyCode as CurrencyCode) ?? DEFAULT_CURRENCY;
  const locale = localeForLanguage(i18n.language);

  const percent = thresholdCents > 0 ? Math.min(100, (progressCents / thresholdCents) * 100) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <p className={styles.label}>
        {t('child.until_next_flower', {
          progress: formatCurrency(progressCents, currency, locale),
          threshold: formatCurrency(thresholdCents, currency, locale),
        })}
      </p>
    </div>
  );
};
