import type { MigrationDefinition } from "@/src/types/database";

export const migration006BudgetSectionPlanning: MigrationDefinition = {
  id: 6,
  name: "006_budget_section_planning",
  sql: `
ALTER TABLE debts ADD COLUMN start_date TEXT;

CREATE INDEX IF NOT EXISTS idx_debts_owner_start_date
  ON debts(owner_type, owner_local_id, start_date);
`,
};
