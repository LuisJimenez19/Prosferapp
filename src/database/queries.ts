import { getDatabase } from './client';
import type { DatabaseTransaction, SqliteBindParams, SqliteBindValue } from '@/src/types/database';

export type QueryParams =
  | SqliteBindParams
  | SqliteBindValue[]
  | Record<string, SqliteBindValue>
  | undefined;

export type QueryResult = {
  changes: number;
  lastInsertRowId: number;
};

type DatabaseLike = DatabaseTransaction;

async function resolveDatabase(db?: DatabaseLike) {
  if (db) {
    return db;
  }

  return getDatabase();
}

export async function execute(sql: string, params?: QueryParams, db?: DatabaseLike) {
  const database = await resolveDatabase(db);
  const result = params === undefined ? await database.runAsync(sql) : await database.runAsync(sql, params);

  return {
    changes: result.changes,
    lastInsertRowId: result.lastInsertRowId,
  } satisfies QueryResult;
}

export async function executeBatch(sql: string, db?: DatabaseLike) {
  const database = await resolveDatabase(db);
  await database.execAsync(sql);
}

export async function getFirst<T>(sql: string, params?: QueryParams, db?: DatabaseLike) {
  const database = await resolveDatabase(db);
  return params === undefined
    ? database.getFirstAsync<T>(sql)
    : database.getFirstAsync<T>(sql, params);
}

export async function getAll<T>(sql: string, params?: QueryParams, db?: DatabaseLike) {
  const database = await resolveDatabase(db);
  return params === undefined ? database.getAllAsync<T>(sql) : database.getAllAsync<T>(sql, params);
}

export async function withTransaction<T>(callback: (db: DatabaseLike) => Promise<T>) {
  const database = await getDatabase();
  let value: T | undefined;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    value = await callback(transaction);
  });

  if (value === undefined) {
    throw new Error('Transaction completed without returning a value.');
  }

  return value;
}
