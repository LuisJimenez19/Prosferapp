import type { MigrationDefinition } from '@/src/types/database';

import { migration001Base } from './001_base';
import { migration002Business } from './002_business';
import { migration003Inventory } from './003_inventory';

export const schemaMigrations: MigrationDefinition[] = [
  migration001Base,
  migration002Business,
  migration003Inventory,
];
