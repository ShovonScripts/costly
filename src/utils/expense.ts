import type { CategoryFilter } from '@/components/category-chips';
import type { Expense } from '@/types/expense';

/**
 * Bangladeshi Taka. Amounts are stored as plain numbers — this symbol is only
 * ever added at format time, never persisted.
 */
export const CURRENCY_SYMBOL = '৳';

// `en-US` grouping on purpose: `en-BD` would switch to lakh/crore grouping
// (12,450 -> 12,450 is fine, but 125,000 -> 1,25,000) and `bn-BD` would switch
// to Bengali numerals. Costly uses Latin digits with Western grouping.
const groupingFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * The single place money is turned into text.
 *
 * Whole amounts print without decimals (৳250, ৳12,450); amounts with a fractional
 * part keep two places (৳12.50) so small charges are never misrepresented.
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasFraction = rounded % 1 !== 0;
  const body = hasFraction
    ? new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rounded)
    : groupingFormatter.format(rounded);

  return `${CURRENCY_SYMBOL}${body}`;
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
  if (!needle) {
    return true;
  }
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
    (expense) =>
      (category === 'All' || expense.category === category) && matchesSearch(expense, query)
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
