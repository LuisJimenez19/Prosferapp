import type { MigrationDefinition } from "@/src/types/database";

export const migration005BudgetFeatureExpansion: MigrationDefinition = {
  id: 5,
  name: "005_budget_feature_expansion",
  sql: `
ALTER TABLE categories ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0;

ALTER TABLE budget_income_items ADD COLUMN destination_wallet_local_id TEXT;

ALTER TABLE debts ADD COLUMN total_installments INTEGER;
ALTER TABLE debts ADD COLUMN installments_paid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE debts ADD COLUMN payoff_target_date TEXT;

ALTER TABLE goals ADD COLUMN description TEXT;
ALTER TABLE goals ADD COLUMN savings_type TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE goals ADD COLUMN annual_yield_rate REAL NOT NULL DEFAULT 0;

UPDATE categories
SET is_system = 1
WHERE deleted_at IS NULL
  AND category_kind = 'expense'
  AND LOWER(TRIM(name)) IN ('comida', 'transporte', 'salud');

CREATE INDEX IF NOT EXISTS idx_categories_system ON categories(owner_type, owner_local_id, is_system);
CREATE INDEX IF NOT EXISTS idx_budget_income_wallet ON budget_income_items(budget_local_id, destination_wallet_local_id);
`,
};
