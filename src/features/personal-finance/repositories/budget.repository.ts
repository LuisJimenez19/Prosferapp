import { execute, getAll, getFirst } from "@/src/database/queries";
import { nowIsoString } from "@/src/lib/dates";
import { generateLocalId } from "@/src/lib/ids";
import type { DatabaseTransaction } from "@/src/types/database";
import { SYNC_STATUS } from "@/src/types/common";
import type {
  Budget,
  BudgetCategoryAllocation,
  BudgetCategoryAllocationDetail,
  BudgetCategoryAllocationRecord,
  BudgetRecord,
  BudgetSetupInput,
} from "../types/budget";

const BUDGET_SELECT_FIELDS = `
  local_id,
  server_id,
  owner_type,
  owner_local_id,
  name,
  budget_period,
  amount_limit,
  currency_code,
  start_date,
  end_date,
  month_key,
  status,
  strategy_type,
  planned_income_total,
  planned_essential_total,
  planned_debt_total,
  planned_goal_total,
  planned_flexible_total,
  buffer_total,
  generated_at,
  sync_status,
  version,
  created_at,
  updated_at,
  deleted_at
`;

const BUDGET_CATEGORY_SELECT_FIELDS = `
  bc.local_id,
  bc.server_id,
  bc.budget_local_id,
  bc.category_local_id,
  bc.allocated_amount,
  bc.priority_order,
  bc.is_fixed,
  bc.expected_day,
  bc.sync_status,
  bc.version,
  bc.created_at,
  bc.updated_at,
  bc.deleted_at
`;

type UpsertMonthlyBudgetInput = Pick<
  BudgetSetupInput,
  "owner_type" | "owner_local_id" | "month_key" | "currency_code" | "preferences"
> & {
  name: string;
  start_date: string;
  end_date: string;
  amount_limit: number;
  planned_income_total: number;
  planned_essential_total: number;
  planned_debt_total: number;
  planned_goal_total: number;
  planned_flexible_total: number;
  buffer_total: number;
  status: Budget["status"];
};

function mapBudgetRecord(record: BudgetRecord): Budget {
  return record;
}

function mapBudgetCategoryAllocationRecord(
  record: BudgetCategoryAllocationRecord,
): BudgetCategoryAllocation {
  return {
    ...record,
    is_fixed: Boolean(record.is_fixed),
  };
}

async function getBudgetByLocalId(localId: string, db?: DatabaseTransaction) {
  const record = await getFirst<BudgetRecord>(
    `
      SELECT ${BUDGET_SELECT_FIELDS}
      FROM budgets
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [localId],
    db,
  );

  if (!record) {
    return null;
  }

  return mapBudgetRecord(record);
}

async function getBudgetByMonth(
  ownerType: string,
  ownerLocalId: string,
  monthKey: string,
  db?: DatabaseTransaction,
) {
  const record = await getFirst<BudgetRecord>(
    `
      SELECT ${BUDGET_SELECT_FIELDS}
      FROM budgets
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND month_key = ?
        AND deleted_at IS NULL
      ORDER BY generated_at DESC, updated_at DESC
      LIMIT 1
    `,
    [ownerType, ownerLocalId, monthKey],
    db,
  );

  if (!record) {
    return null;
  }

  return mapBudgetRecord(record);
}

async function getLatestBudgetByOwner(
  ownerType: string,
  ownerLocalId: string,
  db?: DatabaseTransaction,
) {
  const record = await getFirst<BudgetRecord>(
    `
      SELECT ${BUDGET_SELECT_FIELDS}
      FROM budgets
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND deleted_at IS NULL
      ORDER BY month_key DESC, generated_at DESC, updated_at DESC
      LIMIT 1
    `,
    [ownerType, ownerLocalId],
    db,
  );

  if (!record) {
    return null;
  }

  return mapBudgetRecord(record);
}

async function upsertMonthlyBudget(
  input: UpsertMonthlyBudgetInput,
  db?: DatabaseTransaction,
) {
  const existingBudget = await getBudgetByMonth(
    input.owner_type,
    input.owner_local_id,
    input.month_key,
    db,
  );
  const timestamp = nowIsoString();

  if (existingBudget) {
    await execute(
      `
        UPDATE budgets
        SET
          name = ?,
          budget_period = ?,
          amount_limit = ?,
          currency_code = ?,
          start_date = ?,
          end_date = ?,
          status = ?,
          strategy_type = ?,
          planned_income_total = ?,
          planned_essential_total = ?,
          planned_debt_total = ?,
          planned_goal_total = ?,
          planned_flexible_total = ?,
          buffer_total = ?,
          generated_at = ?,
          sync_status = ?,
          version = ?,
          updated_at = ?
        WHERE local_id = ?
          AND deleted_at IS NULL
      `,
      [
        input.name,
        "monthly",
        input.amount_limit,
        input.currency_code,
        input.start_date,
        input.end_date,
        input.status,
        input.preferences.strategy_type,
        input.planned_income_total,
        input.planned_essential_total,
        input.planned_debt_total,
        input.planned_goal_total,
        input.planned_flexible_total,
        input.buffer_total,
        timestamp,
        SYNC_STATUS.PENDING,
        existingBudget.version + 1,
        timestamp,
        existingBudget.local_id,
      ],
      db,
    );

    const updatedBudget = await getBudgetByLocalId(existingBudget.local_id, db);

    if (!updatedBudget) {
      throw new Error("Budget was not found after update.");
    }

    return updatedBudget;
  }

  const localId = generateLocalId("budget");

  await execute(
    `
      INSERT INTO budgets (
        local_id,
        server_id,
        owner_type,
        owner_local_id,
        name,
        budget_period,
        amount_limit,
        currency_code,
        start_date,
        end_date,
        month_key,
        status,
        strategy_type,
        planned_income_total,
        planned_essential_total,
        planned_debt_total,
        planned_goal_total,
        planned_flexible_total,
        buffer_total,
        generated_at,
        sync_status,
        version,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localId,
      null,
      input.owner_type,
      input.owner_local_id,
      input.name,
      "monthly",
      input.amount_limit,
      input.currency_code,
      input.start_date,
      input.end_date,
      input.month_key,
      input.status,
      input.preferences.strategy_type,
      input.planned_income_total,
      input.planned_essential_total,
      input.planned_debt_total,
      input.planned_goal_total,
      input.planned_flexible_total,
      input.buffer_total,
      timestamp,
      SYNC_STATUS.PENDING,
      1,
      timestamp,
      timestamp,
      null,
    ],
    db,
  );

  const createdBudget = await getBudgetByLocalId(localId, db);

  if (!createdBudget) {
    throw new Error("Budget was not found after creation.");
  }

  return createdBudget;
}

async function replaceBudgetCategoryAllocations(
  budgetLocalId: string,
  allocations: BudgetSetupInput["essential_expenses"],
  db?: DatabaseTransaction,
) {
  const timestamp = nowIsoString();
  const existingRecords = await getAll<BudgetCategoryAllocationRecord>(
    `
      SELECT ${BUDGET_CATEGORY_SELECT_FIELDS}
      FROM budget_categories bc
      WHERE bc.budget_local_id = ?
      ORDER BY bc.created_at ASC
    `,
    [budgetLocalId],
    db,
  );
  const recordsByCategoryLocalId = new Map(
    existingRecords.map((record) => [record.category_local_id, record]),
  );
  const syncedCategoryIds = new Set<string>();

  for (const allocation of allocations) {
    const existingRecord = recordsByCategoryLocalId.get(allocation.category_local_id);

    syncedCategoryIds.add(allocation.category_local_id);

    if (existingRecord) {
      await execute(
        `
          UPDATE budget_categories
          SET
            allocated_amount = ?,
            priority_order = ?,
            is_fixed = ?,
            expected_day = ?,
            sync_status = ?,
            version = ?,
            updated_at = ?,
            deleted_at = NULL
          WHERE local_id = ?
        `,
        [
          allocation.allocated_amount,
          allocation.priority_order ?? 0,
          allocation.is_fixed ? 1 : 0,
          allocation.expected_day ?? null,
          SYNC_STATUS.PENDING,
          existingRecord.version + 1,
          timestamp,
          existingRecord.local_id,
        ],
        db,
      );

      continue;
    }

    await execute(
      `
        INSERT INTO budget_categories (
          local_id,
          server_id,
          budget_local_id,
          category_local_id,
          allocated_amount,
          priority_order,
          is_fixed,
          expected_day,
          sync_status,
          version,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        generateLocalId("budget_category"),
        null,
        budgetLocalId,
        allocation.category_local_id,
        allocation.allocated_amount,
        allocation.priority_order ?? 0,
        allocation.is_fixed ? 1 : 0,
        allocation.expected_day ?? null,
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
    (record) =>
      record.deleted_at === null && !syncedCategoryIds.has(record.category_local_id),
  );

  for (const record of activeRecordsToRemove) {
    await execute(
      `
        UPDATE budget_categories
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

  return listBudgetCategoryAllocations(budgetLocalId, db);
}

async function listBudgetCategoryAllocations(
  budgetLocalId: string,
  db?: DatabaseTransaction,
) {
  const records = await getAll<BudgetCategoryAllocationRecord>(
    `
      SELECT ${BUDGET_CATEGORY_SELECT_FIELDS}
      FROM budget_categories bc
      WHERE bc.budget_local_id = ?
        AND bc.deleted_at IS NULL
      ORDER BY bc.priority_order ASC, bc.created_at ASC
    `,
    [budgetLocalId],
    db,
  );

  return records.map(mapBudgetCategoryAllocationRecord);
}

async function listBudgetCategoryAllocationDetails(
  budgetLocalId: string,
  db?: DatabaseTransaction,
) {
  const records = await getAll<
    BudgetCategoryAllocationRecord & {
      category_name: string;
      budget_role: BudgetCategoryAllocationDetail["budget_role"];
    }
  >(
    `
      SELECT
        ${BUDGET_CATEGORY_SELECT_FIELDS},
        c.name AS category_name,
        c.budget_role AS budget_role
      FROM budget_categories bc
      INNER JOIN categories c ON c.local_id = bc.category_local_id
      WHERE bc.budget_local_id = ?
        AND bc.deleted_at IS NULL
      ORDER BY bc.priority_order ASC, c.name ASC
    `,
    [budgetLocalId],
    db,
  );

  return records.map((record) => ({
    ...mapBudgetCategoryAllocationRecord(record),
    category_name: record.category_name,
    budget_role: record.budget_role,
  }));
}

export const budgetRepository = {
  getBudgetByLocalId,
  getBudgetByMonth,
  getLatestBudgetByOwner,
  listBudgetCategoryAllocationDetails,
  listBudgetCategoryAllocations,
  replaceBudgetCategoryAllocations,
  upsertMonthlyBudget,
};
