ALTER TABLE budgets ADD COLUMN month_key TEXT;
ALTER TABLE budgets ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE budgets ADD COLUMN strategy_type TEXT NOT NULL DEFAULT 'priority-based';
ALTER TABLE budgets ADD COLUMN planned_income_total REAL NOT NULL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN planned_essential_total REAL NOT NULL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN planned_debt_total REAL NOT NULL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN planned_goal_total REAL NOT NULL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN planned_flexible_total REAL NOT NULL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN buffer_total REAL NOT NULL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN generated_at TEXT;

ALTER TABLE budget_categories ADD COLUMN priority_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE budget_categories ADD COLUMN is_fixed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE budget_categories ADD COLUMN expected_day INTEGER;

ALTER TABLE goals ADD COLUMN priority_rank INTEGER NOT NULL DEFAULT 0;
ALTER TABLE goals ADD COLUMN target_monthly_contribution REAL NOT NULL DEFAULT 0;
ALTER TABLE goals ADD COLUMN is_flexible INTEGER NOT NULL DEFAULT 0;

ALTER TABLE categories ADD COLUMN budget_role TEXT NOT NULL DEFAULT 'flexible';
ALTER TABLE categories ADD COLUMN is_essential INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN default_goal_local_id TEXT;
ALTER TABLE categories ADD COLUMN default_debt_local_id TEXT;

CREATE TABLE IF NOT EXISTS budget_income_items (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  budget_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  expected_amount REAL NOT NULL,
  expected_day INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  reliability_level TEXT NOT NULL DEFAULT 'fixed',
  sync_status TEXT NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (budget_local_id) REFERENCES budgets(local_id)
);

CREATE TABLE IF NOT EXISTS debts (
  local_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT UNIQUE,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  debt_type TEXT NOT NULL,
  lender_name TEXT,
  current_balance REAL NOT NULL DEFAULT 0,
  minimum_payment REAL NOT NULL DEFAULT 0,
  target_payment REAL NOT NULL DEFAULT 0,
  due_day INTEGER,
  interest_rate REAL,
  priority_rank INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  sync_status TEXT NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

UPDATE budgets
SET
  month_key = SUBSTR(start_date, 1, 7),
  generated_at = COALESCE(generated_at, updated_at)
WHERE month_key IS NULL;

UPDATE categories
SET
  budget_role = CASE
    WHEN category_kind = 'income' THEN 'income'
    WHEN LOWER(TRIM(name)) IN ('comida', 'transporte', 'salud') THEN 'essential'
    ELSE 'flexible'
  END,
  is_essential = CASE
    WHEN LOWER(TRIM(name)) IN ('comida', 'transporte', 'salud') THEN 1
    ELSE 0
  END
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budget_income_items_budget ON budget_income_items(budget_local_id, expected_day);
CREATE INDEX IF NOT EXISTS idx_debts_owner ON debts(owner_type, owner_local_id);
CREATE INDEX IF NOT EXISTS idx_categories_budget_role ON categories(owner_type, owner_local_id, budget_role);
CREATE INDEX IF NOT EXISTS idx_budgets_month_key ON budgets(owner_type, owner_local_id, month_key);
