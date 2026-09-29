import {
  countExpenses,
  deleteExpense,
  getAllExpenses,
  getExpenseById,
  insertExpense,
  updateExpense,
} from '@/storage/expense-repository';
import type { Expense } from '@/types/expense';

const TEST_ID = 'sqlite-test-1';

const TEST_EXPENSE: Expense = {
  id: TEST_ID,
  amount: 1250,
  category: 'Food',
  date: '2026-09-29T12:00:00.000Z',
  note: 'SQLite test',
};

function pass(step: string) {
  console.log(`[SQLite TEST] ${step}: PASS`);
}

function fail(step: string, detail: string) {
  console.error(`[SQLite TEST] ${step}: FAIL — ${detail}`);
}

function check(step: string, condition: boolean, detail = 'assertion returned false') {
  if (condition) {
    pass(step);
  } else {
    fail(step, detail);
  }
}

/**
 * Dev-only CRUD exercise. Touches only the SQLite `expenses` table and only the
 * `sqlite-test-1` row — it never reads or writes AsyncStorage.
 *
 * It deletes the test row both before and after, so it is re-runnable and
 * leaves the table exactly as it found it.
 */
export async function runSqliteCrudTest(): Promise<void> {
  console.log('[SQLite TEST] starting');

  try {
    // Clean slate, in case a previous run aborted partway.
    await deleteExpense(TEST_ID);

    // 1. INSERT
    await insertExpense(TEST_EXPENSE);
    const afterInsert = await getExpenseById(TEST_ID);
    check(
      'INSERT',
      afterInsert?.amount === 1250,
      `expected amount 1250, got ${afterInsert?.amount}`
    );

    // 2. SELECT ALL — includes the inserted row, newest first.
    const all = await getAllExpenses();
    check('SELECT ALL', all.some((row) => row.id === TEST_ID), 'test row missing from list');

    // 3. SELECT BY ID
    const found = await getExpenseById(TEST_ID);
    check(
      'SELECT BY ID',
      found?.note === 'SQLite test' && found?.category === 'Food',
      `unexpected row: ${JSON.stringify(found)}`
    );

    // 4. UPDATE — amount 1250 -> 1500, note also changes to prove the
    //    date/id stay put.
    await updateExpense(TEST_ID, {
      amount: 1500,
      category: 'Food',
      note: 'SQLite test (updated)',
    });

    // 5. Re-read to confirm the write landed.
    const updated = await getExpenseById(TEST_ID);
    check(
      'UPDATE',
      updated?.amount === 1500 && updated?.note === 'SQLite test (updated)',
      `expected 1500 / updated note, got ${updated?.amount} / ${updated?.note}`
    );
    check(
      'UPDATE (date preserved)',
      updated?.date === TEST_EXPENSE.date,
      `date changed to ${updated?.date}`
    );

    // 6. DELETE
    await deleteExpense(TEST_ID);

    // 7. Confirm it is gone.
    const gone = await getExpenseById(TEST_ID);
    check('DELETE', gone === undefined, `row still present: ${JSON.stringify(gone)}`);

    const remaining = await countExpenses();
    console.log(`[SQLite TEST] DONE — ${remaining} row(s) left in expenses`);
  } catch (error) {
    fail('UNEXPECTED ERROR', error instanceof Error ? error.message : String(error));
  }
}
