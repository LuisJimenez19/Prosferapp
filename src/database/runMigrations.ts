import type { DatabaseClient, SchemaMigrationRecord } from '@/src/types/database';
import { schemaMigrations } from './schema';

async function ensureMigrationsTable(db: DatabaseClient) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigration(db: DatabaseClient, id: number) {
  return db.getFirstAsync<SchemaMigrationRecord>(
    'SELECT id, name, applied_at FROM schema_migrations WHERE id = ?',
    [id],
  );
}

export async function runMigrations(db: DatabaseClient) {
  await ensureMigrationsTable(db);

  for (const migration of schemaMigrations) {
    const alreadyApplied = await getAppliedMigration(db, migration.id);

    if (alreadyApplied) {
      continue;
    }

    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(migration.sql);
      await transaction.runAsync(
        'INSERT INTO schema_migrations (id, name) VALUES (?, ?)',
        [migration.id, migration.name],
      );
    });
  }
}
