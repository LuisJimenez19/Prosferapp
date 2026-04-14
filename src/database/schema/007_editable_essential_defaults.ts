import type { MigrationDefinition } from "@/src/types/database";

export const migration007EditableEssentialDefaults: MigrationDefinition = {
  id: 7,
  name: "007_editable_essential_defaults",
  sql: `
UPDATE categories
SET
  is_system = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE category_kind = 'expense'
  AND is_essential = 1
  AND deleted_at IS NULL;

INSERT INTO categories (
  local_id,
  server_id,
  owner_type,
  owner_local_id,
  parent_local_id,
  name,
  category_kind,
  color_hex,
  icon_name,
  budget_role,
  is_essential,
  is_system,
  default_goal_local_id,
  default_debt_local_id,
  sync_status,
  version,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  lower(hex(randomblob(16))),
  NULL,
  'personal',
  p.local_id,
  NULL,
  defaults.name,
  'expense',
  NULL,
  NULL,
  'essential',
  1,
  0,
  NULL,
  NULL,
  'pending',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
FROM personal_profiles p
JOIN (
  SELECT 'Comida' AS name
  UNION ALL SELECT 'Salud'
  UNION ALL SELECT 'Servicios'
  UNION ALL SELECT 'Entrenamiento'
  UNION ALL SELECT 'Transporte'
) AS defaults
WHERE NOT EXISTS (
  SELECT 1
  FROM categories c
  WHERE c.owner_type = 'personal'
    AND c.owner_local_id = p.local_id
    AND c.category_kind = 'expense'
    AND LOWER(TRIM(c.name)) = LOWER(TRIM(defaults.name))
    AND c.deleted_at IS NULL
);
`,
};
