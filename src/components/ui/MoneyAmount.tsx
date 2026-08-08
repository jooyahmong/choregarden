import { useTranslation } from 'react-i18next';
import { useFamily } from '../../contexts/FamilyContext';
import { formatCurrency, localeForLanguage } from '../../utils/formatting';
import { DEFAULT_CURRENCY, type CurrencyCode } from '../../utils/currencies';

interface MoneyAmountProps {
  cents: number;
  className?: string;
  /** Overrides the family's current currency — used to keep past records
   * displayed in whatever currency was active when they happened, even
   * after the family later switches currencies. */
  currencyCode?: string | null;
}

export const MoneyAmount = ({ cents, className, currencyCode }: MoneyAmountProps) => {
  const { i18n } = useTranslation();
  const { family } = useFamily();
  const currency = (currencyCode as CurrencyCode) || (family?.currencyCode as CurrencyCode) || DEFAULT_CURRENCY;
  const locale = localeForLanguage(i18n.language);

  return <span className={className}>{formatCurrency(cents, currency, locale)}</span>;
};
