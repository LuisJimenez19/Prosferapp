import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'prosfer.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function configureDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;
  `);
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await configureDatabase(db);
      return db;
    });
  }

  return databasePromise;
}

export async function closeDatabase() {
  if (!databasePromise) {
    return;
  }

  const db = await databasePromise;
  await db.closeAsync();
  databasePromise = null;
}

export async function deleteDatabase() {
  await closeDatabase();
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
}
