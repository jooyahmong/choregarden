import type { CurrencyCode } from './currencies';

export const localeForLanguage = (language: string): string =>
  language === 'ko' ? 'ko-KR' : 'en-US';

/**
 * amountCents is always an integer (real amount * 100), regardless of the
 * currency's own minor unit — Intl.NumberFormat applies each currency's
 * correct decimal display (e.g. 0 for KRW/JPY) from the real amount.
 */
export const formatCurrency = (
  amountCents: number,
  currency: CurrencyCode,
  locale: string
): string => {
  const amount = amountCents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export type DateFormatStyle = 'short' | 'long' | 'full';

export const formatDate = (
  date: Date,
  style: DateFormatStyle = 'short',
  locale: string
): string => {
  const options: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  };
  return new Intl.DateTimeFormat(locale, options[style]).format(date);
};

export const formatTime = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);

/**
 * Fiscal year label: the calendar year the FY ends in (matches AU
 * convention). For fiscalYearStartMonth === 1 this equals the plain
 * calendar year.
 */
export const getFiscalYearLabel = (date: Date, fiscalYearStartMonth: number): number => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (fiscalYearStartMonth === 1) return year;
  return month >= fiscalYearStartMonth ? year + 1 : year;
};

export const getFiscalYearRange = (
  fiscalYearStartMonth: number,
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date; label: number } => {
  const label = getFiscalYearLabel(referenceDate, fiscalYearStartMonth);
  const startYear = fiscalYearStartMonth === 1 ? label : label - 1;
  const startDate = new Date(startYear, fiscalYearStartMonth - 1, 1);
  const endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), 0);
  return { startDate, endDate, label };
};
