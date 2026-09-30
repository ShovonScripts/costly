import type { CategoryFilter } from '@/components/category-chips';
import { COUNTRIES, DEFAULT_COUNTRY, type CurrencyCode } from '@/constants/countries';
import type { Expense } from '@/types/expense';

/** Default currency used for fresh installs; user settings can select another. */
export const CURRENCY_SYMBOL = DEFAULT_COUNTRY.symbol;

const groupingFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format amounts using the currency selected by the user. */
export function formatCurrency(amount: number, currencyCode: CurrencyCode = DEFAULT_COUNTRY.currencyCode): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasFraction = rounded % 1 !== 0;
  const body = hasFraction
    ? new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rounded)
    : groupingFormatter.format(rounded);
  const symbol = COUNTRIES.find((country) => country.currencyCode === currencyCode)?.symbol ?? CURRENCY_SYMBOL;

  return `${symbol}${body}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** e.g. "29 Sep 2026" */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Newest first, so the list is always in the order the user expects. */
export function sortByDateDesc(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Case-insensitive match across the note, the category, and the amount so
 * typing "12" or "food" both narrow the list.
 */
export function matchesSearch(expense: Expense, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    expense.note.toLowerCase().includes(needle) ||
    expense.category.toLowerCase().includes(needle) ||
    String(expense.amount).includes(needle)
  );
}

export function filterExpenses(
  expenses: Expense[],
  query: string,
  category: CategoryFilter
): Expense[] {
  return expenses.filter(
    (expense) => (category === 'All' || expense.category === category) && matchesSearch(expense, query)
  );
}

export function sumAmounts(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function totalForDate(expenses: Expense[], target: Date): number {
  return sumAmounts(expenses.filter((expense) => isSameDay(new Date(expense.date), target)));
}

export function totalForMonth(expenses: Expense[], target: Date): number {
  return sumAmounts(expenses.filter((expense) => isSameMonth(new Date(expense.date), target)));
}
