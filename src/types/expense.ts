export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  /** ISO 8601 timestamp, e.g. "2026-09-29T12:00:00.000Z" */
  date: string;
  note: string;
}

/** What the Add / Edit Expense forms produce. The provider fills in `id` and `date`. */
export type ExpenseDraft = Omit<Expense, 'id' | 'date'>;
