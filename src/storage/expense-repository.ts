import { initDatabase } from '@/storage/db';
import type { Expense, ExpenseDraft } from '@/types/expense';

/**
 * SQLite CRUD for the `expenses` table.
 *
 * Every statement uses a placeholder (`?` or `$name`) and passes values through
 * the params argument. Nothing user-supplied is ever concatenated into a SQL
 * string, so the search box and forms cannot become an injection vector.
 *
 * This module is NOT wired into the app yet — AsyncStorage still backs
 * ExpenseContext. It exists to be exercised on its own.
 */

export async function insertExpense(expense: Expense): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'INSERT INTO expenses (id, amount, category, date, note) VALUES (?, ?, ?, ?, ?)',
    expense.id,
    expense.amount,
    expense.category,
    expense.date,
    expense.note
  );
}

/** Newest first, so callers do not have to sort. */
export async function getAllExpenses(): Promise<Expense[]> {
  const db = await initDatabase();
  return db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC');
}

/** Returns `undefined` when no row matches, mirroring the provider's `getExpense`. */
export async function getExpenseById(id: string): Promise<Expense | undefined> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<Expense>('SELECT * FROM expenses WHERE id = ?', id);
  return row ?? undefined;
}

/**
 * Updates only amount, category and note. `id` and `date` are deliberately not
 * writable, which matches `ExpenseDraft` omitting them.
 */
export async function updateExpense(id: string, changes: ExpenseDraft): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'UPDATE expenses SET amount = ?, category = ?, note = ? WHERE id = ?',
    changes.amount,
    changes.category,
    changes.note,
    id
  );
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

/** Exposed for tests that need to assert on the table directly. */
export async function countExpenses(): Promise<number> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM expenses');
  return row?.count ?? 0;
}
