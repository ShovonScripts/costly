/**
 * SQLite CRUD smoke test is intended for native development builds only.
 * The expense app currently uses AsyncStorage on web, so don't pull the
 * experimental SQLite web worker into the browser bundle just to run a test.
 */
export async function runSqliteCrudTest(): Promise<void> {
  // Native implementation lives in sqlite-crud-test.ts.
}
