export const SUPPORTED_CURRENCIES = [
  'AUD',
  'KRW',
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'NZD',
  'JPY',
  'SGD',
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'AUD';
