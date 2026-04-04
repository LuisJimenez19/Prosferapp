import { getDatabase } from './client';
import { runMigrations } from './runMigrations';
import { seedInitialData } from './seedInitialData';

let initializationPromise: Promise<void> | null = null;

export async function initDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const db = await getDatabase();
      await runMigrations(db);
      await seedInitialData();
    })();
  }

  return initializationPromise;
}
