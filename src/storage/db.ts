import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'costly.db';

/**
 * Schema DDL. Every statement is guarded with `IF NOT EXISTS`, so running this
 * more than once is safe — on a fresh install it creates everything, and on
 * later launches it is a no-op.
 *
 * The date column is stored as an ISO-8601 TEXT string, which is the same shape
 * the AsyncStorage implementation already uses. ISO-8601 sorts correctly
 * lexicographically, so `ORDER BY date DESC` gives chronological order.
 */
const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_expenses_date
ON expenses (date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_category
ON expenses (category);
`;

/**
 * Cached so that repeat calls (React strict mode, fast refresh, several
 * components asking at once) reuse a single open + schema pass instead of
 * racing to create the same objects.
 */
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndPrepare(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(SCHEMA_SQL);
  return db;
}

/**
 * Opens `costly.db` and ensures the schema exists. Safe to call any number of
 * times; the underlying work happens once.
 */
export function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!initPromise) {
    initPromise = openAndPrepare().catch((error) => {
      // Clear the cache so a later call can retry instead of replaying a
      // rejected promise forever.
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
