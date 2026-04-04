import type { MigrationDefinition } from '@/src/types/database';
import { SYNC_STATUS } from '@/src/types/common';

export const migration003Inventory: MigrationDefinition = {
  id: 3,
  name: '003_inventory',
  sql: `
CREATE TABLE IF NOT EXISTS inventory_items (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  product_local_id TEXT NOT NULL,
  quantity_on_hand REAL NOT NULL DEFAULT 0,
  reorder_level REAL NOT NULL DEFAULT 0,
  average_cost REAL NOT NULL DEFAULT 0,
  last_movement_at TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id),
  FOREIGN KEY (product_local_id) REFERENCES products(local_id),
  UNIQUE (business_local_id, product_local_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  business_local_id TEXT NOT NULL,
  inventory_item_local_id TEXT NOT NULL,
  product_local_id TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  source_type TEXT,
  source_local_id TEXT,
  quantity_delta REAL NOT NULL,
  quantity_after REAL NOT NULL,
  unit_cost_snapshot REAL,
  item_name_snapshot TEXT NOT NULL,
  note TEXT,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (business_local_id) REFERENCES businesses(local_id),
  FOREIGN KEY (inventory_item_local_id) REFERENCES inventory_items(local_id),
  FOREIGN KEY (product_local_id) REFERENCES products(local_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_business ON inventory_items(business_local_id, product_local_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_item ON stock_movements(inventory_item_local_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_source ON stock_movements(source_type, source_local_id);
`,
};
