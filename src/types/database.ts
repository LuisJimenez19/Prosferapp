import type * as SQLite from 'expo-sqlite';

import type { ISODateString } from './common';

export interface MigrationDefinition {
  id: number;
  name: string;
  sql: string;
}

export interface SchemaMigrationRecord {
  id: number;
  name: string;
  applied_at: ISODateString;
}

export type DatabaseClient = SQLite.SQLiteDatabase;

export type DatabaseTransaction = Pick<
  SQLite.SQLiteDatabase,
  'execAsync' | 'getAllAsync' | 'getFirstAsync' | 'runAsync' | 'withExclusiveTransactionAsync'
>;

export type SqliteBindParams = SQLite.SQLiteBindParams;
export type SqliteBindValue = SQLite.SQLiteBindValue;
