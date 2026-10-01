export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
] as const;

/** Built-in names stay suggested in editors while custom category names are also valid. */
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number] | (string & {});

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  /** ISO 8601 timestamp, e.g. "2026-09-29T12:00:00.000Z" */
  date: string;
  note: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string | null;
  recurringParentId?: string;
  receiptUri?: string;
}

/** What the Add / Edit forms produce. The provider fills in `id` and defaults `date`. */
export type ExpenseDraft = Pick<Expense, 'amount' | 'category' | 'note'> & {
  date?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string | null;
  receiptUri?: string;
};
