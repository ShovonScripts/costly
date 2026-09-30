export const COUNTRIES = [
  { code: 'BD', name: 'Bangladesh', currencyCode: 'BDT', symbol: '৳' },
  { code: 'US', name: 'United States', currencyCode: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canada', currencyCode: 'CAD', symbol: 'C$' },
  { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', symbol: '£' },
  { code: 'IN', name: 'India', currencyCode: 'INR', symbol: '₹' },
  { code: 'PK', name: 'Pakistan', currencyCode: 'PKR', symbol: 'Rs ' },
  { code: 'NP', name: 'Nepal', currencyCode: 'NPR', symbol: 'रू ' },
  { code: 'LK', name: 'Sri Lanka', currencyCode: 'LKR', symbol: 'Rs ' },
  { code: 'MY', name: 'Malaysia', currencyCode: 'MYR', symbol: 'RM ' },
  { code: 'SG', name: 'Singapore', currencyCode: 'SGD', symbol: 'S$' },
  { code: 'AU', name: 'Australia', currencyCode: 'AUD', symbol: 'A$' },
  { code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED', symbol: 'د.إ ' },
  { code: 'SA', name: 'Saudi Arabia', currencyCode: 'SAR', symbol: 'ر.س ' },
  { code: 'JP', name: 'Japan', currencyCode: 'JPY', symbol: '¥' },
  { code: 'CN', name: 'China', currencyCode: 'CNY', symbol: 'CN¥' },
  { code: 'DE', name: 'Germany', currencyCode: 'EUR', symbol: '€' },
  { code: 'FR', name: 'France', currencyCode: 'EUR', symbol: '€' },
  { code: 'IT', name: 'Italy', currencyCode: 'EUR', symbol: '€' },
  { code: 'ES', name: 'Spain', currencyCode: 'EUR', symbol: '€' },
  { code: 'NL', name: 'Netherlands', currencyCode: 'EUR', symbol: '€' },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];
export type CurrencyCode = (typeof COUNTRIES)[number]['currencyCode'];
export type CountryOption = (typeof COUNTRIES)[number];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function getCountry(countryCode: string): CountryOption {
  return COUNTRIES.find((country) => country.code === countryCode) ?? DEFAULT_COUNTRY;
}
