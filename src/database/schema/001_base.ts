import type { MigrationDefinition } from '@/src/types/database';
import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import { SYNC_STATUS } from '@/src/types/common';

export const migration001Base: MigrationDefinition = {
  id: 1,
  name: '001_base',
  sql: `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  display_name TEXT NOT NULL,
  preferred_currency TEXT NOT NULL DEFAULT '${DEFAULT_CURRENCY_CODE}',
  timezone TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS personal_profiles (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  user_local_id TEXT NOT NULL,
  full_name TEXT,
  country_code TEXT,
  default_wallet_local_id TEXT,
  birth_date TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (user_local_id) REFERENCES users(local_id)
);

CREATE TABLE IF NOT EXISTS wallets (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  initial_balance REAL NOT NULL DEFAULT 0,
  current_balance REAL NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  parent_local_id TEXT,
  name TEXT NOT NULL,
  category_kind TEXT NOT NULL,
  color_hex TEXT,
  icon_name TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (parent_local_id) REFERENCES categories(local_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  wallet_local_id TEXT NOT NULL,
  category_local_id TEXT,
  related_sale_local_id TEXT,
  related_purchase_local_id TEXT,
  transaction_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount REAL NOT NULL,
  currency_code TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  note TEXT,
  reference_type TEXT,
  reference_local_id TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (wallet_local_id) REFERENCES wallets(local_id),
  FOREIGN KEY (category_local_id) REFERENCES categories(local_id)
);

CREATE TABLE IF NOT EXISTS budgets (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  budget_period TEXT NOT NULL,
  amount_limit REAL NOT NULL,
  currency_code TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS budget_categories (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  budget_local_id TEXT NOT NULL,
  category_local_id TEXT NOT NULL,
  allocated_amount REAL NOT NULL,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (budget_local_id) REFERENCES budgets(local_id),
  FOREIGN KEY (category_local_id) REFERENCES categories(local_id),
  UNIQUE (budget_local_id, category_local_id)
);

CREATE TABLE IF NOT EXISTS goals (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL,
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  goal_local_id TEXT NOT NULL,
  transaction_local_id TEXT,
  amount REAL NOT NULL,
  contributed_at TEXT NOT NULL,
  note TEXT,
  sync_status TEXT NOT NULL DEFAULT '${SYNC_STATUS.PENDING}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (goal_local_id) REFERENCES goals(local_id),
  FOREIGN KEY (transaction_local_id) REFERENCES transactions(local_id)
);

CREATE TABLE IF NOT EXISTS sync_queue (
  local_id TEXT PRIMARY KEY NOT NULL,
  entity_name TEXT NOT NULL,
  entity_local_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  local_id TEXT PRIMARY KEY NOT NULL,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  value_type TEXT NOT NULL DEFAULT 'string',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets(owner_type, owner_local_id);
CREATE INDEX IF NOT EXISTS idx_categories_owner ON categories(owner_type, owner_local_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(owner_type, owner_local_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_local_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_local_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_type, reference_local_id);
CREATE INDEX IF NOT EXISTS idx_budgets_owner ON budgets(owner_type, owner_local_id);
CREATE INDEX IF NOT EXISTS idx_goals_owner ON goals(owner_type, owner_local_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions(goal_local_id, contributed_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, created_at);
`,
};
