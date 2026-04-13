import { execute, getAll } from "@/src/database/queries";
import { nowIsoString } from "@/src/lib/dates";
import { generateLocalId } from "@/src/lib/ids";
import type { DatabaseTransaction } from "@/src/types/database";
import { SYNC_STATUS } from "@/src/types/common";
import type {
  MonthlyIncomePlanItem,
  MonthlyIncomePlanItemRecord,
  MonthlyIncomePlanningInput,
} from "../types/budget";

const BUDGET_INCOME_SELECT_FIELDS = `
  local_id,
  server_id,
  budget_local_id,
  name,
  expected_amount,
  expected_day,
  destination_wallet_local_id,
  is_primary,
  reliability_level,
  sync_status,
  version,
  created_at,
  updated_at,
  deleted_at
`;

function mapIncomeRecord(record: MonthlyIncomePlanItemRecord): MonthlyIncomePlanItem {
  return {
    ...record,
    is_primary: Boolean(record.is_primary),
  };
}

async function listBudgetIncomeItems(
  budgetLocalId: string,
  db?: DatabaseTransaction,
) {
  const records = await getAll<MonthlyIncomePlanItemRecord>(
    `
      SELECT ${BUDGET_INCOME_SELECT_FIELDS}
      FROM budget_income_items
      WHERE budget_local_id = ?
        AND deleted_at IS NULL
      ORDER BY is_primary DESC, expected_day ASC, created_at ASC
    `,
    [budgetLocalId],
    db,
  );

  return records.map(mapIncomeRecord);
}

async function replaceBudgetIncomeItems(
  budgetLocalId: string,
  items: MonthlyIncomePlanningInput[],
  db?: DatabaseTransaction,
) {
  const timestamp = nowIsoString();
  const existingRecords = await getAll<MonthlyIncomePlanItemRecord>(
    `
      SELECT ${BUDGET_INCOME_SELECT_FIELDS}
      FROM budget_income_items
      WHERE budget_local_id = ?
      ORDER BY created_at ASC
    `,
    [budgetLocalId],
    db,
  );
  const recordsByLocalId = new Map(
    existingRecords.map((record) => [record.local_id, record]),
  );
  const syncedLocalIds = new Set<string>();

  for (const item of items) {
    const nextLocalId = item.local_id ?? generateLocalId("budget_income");
    const existingRecord = recordsByLocalId.get(nextLocalId);

    syncedLocalIds.add(nextLocalId);

    if (existingRecord) {
      await execute(
        `
          UPDATE budget_income_items
          SET
            name = ?,
            expected_amount = ?,
            expected_day = ?,
            destination_wallet_local_id = ?,
            is_primary = ?,
            reliability_level = ?,
            sync_status = ?,
            version = ?,
            updated_at = ?,
            deleted_at = NULL
          WHERE local_id = ?
        `,
        [
          item.name.trim(),
          item.expected_amount,
          item.expected_day ?? null,
          item.destination_wallet_local_id ?? null,
          item.is_primary ? 1 : 0,
          item.reliability_level ?? existingRecord.reliability_level,
          SYNC_STATUS.PENDING,
          existingRecord.version + 1,
          timestamp,
          nextLocalId,
        ],
        db,
      );

      continue;
    }

    await execute(
      `
        INSERT INTO budget_income_items (
          local_id,
          server_id,
          budget_local_id,
          name,
          expected_amount,
          expected_day,
          destination_wallet_local_id,
          is_primary,
          reliability_level,
          sync_status,
          version,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nextLocalId,
        null,
        budgetLocalId,
        item.name.trim(),
        item.expected_amount,
        item.expected_day ?? null,
        item.destination_wallet_local_id ?? null,
        item.is_primary ? 1 : 0,
        item.reliability_level ?? "fixed",
        SYNC_STATUS.PENDING,
        1,
        timestamp,
        timestamp,
        null,
      ],
      db,
    );
  }

  const activeRecordsToRemove = existingRecords.filter(
    (record) => record.deleted_at === null && !syncedLocalIds.has(record.local_id),
  );

  for (const record of activeRecordsToRemove) {
    await execute(
      `
        UPDATE budget_income_items
        SET
          deleted_at = ?,
          updated_at = ?,
          sync_status = ?,
          version = ?
        WHERE local_id = ?
          AND deleted_at IS NULL
      `,
      [
        timestamp,
        timestamp,
        SYNC_STATUS.PENDING,
        record.version + 1,
        record.local_id,
      ],
      db,
    );
  }

  return listBudgetIncomeItems(budgetLocalId, db);
}

export const budgetIncomeRepository = {
  listBudgetIncomeItems,
  replaceBudgetIncomeItems,
};
