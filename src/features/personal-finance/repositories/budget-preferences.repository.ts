import { execute, getFirst } from "@/src/database/queries";
import { nowIsoString } from "@/src/lib/dates";
import { generateLocalId } from "@/src/lib/ids";
import type { DatabaseTransaction } from "@/src/types/database";
import type { BudgetPreferences } from "../types/budget";

const BUDGET_PREFERENCES_KEY_PREFIX = "personal_budget_preferences";

function buildPreferencesKey(ownerLocalId: string) {
  return `${BUDGET_PREFERENCES_KEY_PREFIX}:${ownerLocalId}`;
}

export const DEFAULT_BUDGET_PREFERENCES: BudgetPreferences = {
  strategy_type: "priority-based",
  buffer_mode: "percentage",
  buffer_value: 10,
  prioritize_debt_over_goals: true,
  allow_flexible_spending: true,
  alert_threshold_percentage: 10,
  overspend_threshold_amount: 0,
  auto_assign_extra_income: true,
};

async function getBudgetPreferences(ownerLocalId: string) {
  const record = await getFirst<{ setting_value: string | null }>(
    `
      SELECT setting_value
      FROM app_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [buildPreferencesKey(ownerLocalId)],
  );

  if (!record?.setting_value) {
    return DEFAULT_BUDGET_PREFERENCES;
  }

  try {
    return {
      ...DEFAULT_BUDGET_PREFERENCES,
      ...(JSON.parse(record.setting_value) as Partial<BudgetPreferences>),
    } satisfies BudgetPreferences;
  } catch {
    return DEFAULT_BUDGET_PREFERENCES;
  }
}

async function saveBudgetPreferences(
  ownerLocalId: string,
  preferences: BudgetPreferences,
  db?: DatabaseTransaction,
) {
  const timestamp = nowIsoString();
  const settingKey = buildPreferencesKey(ownerLocalId);
  const serializedPreferences = JSON.stringify(preferences);
  const existingSetting = await getFirst<{ local_id: string }>(
    `
      SELECT local_id
      FROM app_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [settingKey],
    db,
  );

  if (existingSetting) {
    await execute(
      `
        UPDATE app_settings
        SET
          setting_value = ?,
          value_type = ?,
          updated_at = ?
        WHERE setting_key = ?
      `,
      [serializedPreferences, "json", timestamp, settingKey],
      db,
    );

    return preferences;
  }

  await execute(
    `
      INSERT INTO app_settings (
        local_id,
        setting_key,
        setting_value,
        value_type,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      generateLocalId("setting"),
      settingKey,
      serializedPreferences,
      "json",
      timestamp,
    ],
    db,
  );

  return preferences;
}

export const budgetPreferencesRepository = {
  getBudgetPreferences,
  saveBudgetPreferences,
};
