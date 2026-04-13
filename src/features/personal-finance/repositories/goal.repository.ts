import { execute, getAll, getFirst } from "@/src/database/queries";
import { nowIsoString } from "@/src/lib/dates";
import { generateLocalId } from "@/src/lib/ids";
import type { DatabaseTransaction } from "@/src/types/database";
import { SYNC_STATUS } from "@/src/types/common";
import type {
  GoalContribution,
  GoalContributionRecord,
  SavingsGoal,
  SavingsGoalPlanningInput,
  SavingsGoalRecord,
} from "../types/goal";

const GOAL_SELECT_FIELDS = `
  local_id,
  server_id,
  owner_type,
  owner_local_id,
  name,
  description,
  target_amount,
  current_amount,
  currency_code,
  target_date,
  status,
  priority_rank,
  target_monthly_contribution,
  is_flexible,
  savings_type,
  annual_yield_rate,
  sync_status,
  version,
  created_at,
  updated_at,
  deleted_at
`;

function mapGoalRecord(record: SavingsGoalRecord): SavingsGoal {
  return {
    ...record,
    is_flexible: Boolean(record.is_flexible),
  };
}

async function getGoalByLocalId(localId: string, db?: DatabaseTransaction) {
  const record = await getFirst<SavingsGoalRecord>(
    `
      SELECT ${GOAL_SELECT_FIELDS}
      FROM goals
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

  return mapGoalRecord(record);
}

async function listGoalsByOwner(
  ownerType: string,
  ownerLocalId: string,
  db?: DatabaseTransaction,
) {
  const records = await getAll<SavingsGoalRecord>(
    `
      SELECT ${GOAL_SELECT_FIELDS}
      FROM goals
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND deleted_at IS NULL
      ORDER BY priority_rank ASC, target_date ASC, created_at ASC
    `,
    [ownerType, ownerLocalId],
    db,
  );

  return records.map(mapGoalRecord);
}

async function createGoal(
  ownerType: string,
  ownerLocalId: string,
  input: SavingsGoalPlanningInput,
  db?: DatabaseTransaction,
) {
  const timestamp = nowIsoString();
  const localId = generateLocalId("goal");

  await execute(
    `
      INSERT INTO goals (
        local_id,
        server_id,
        owner_type,
        owner_local_id,
        name,
        description,
        target_amount,
        current_amount,
        currency_code,
        target_date,
        status,
        priority_rank,
        target_monthly_contribution,
        is_flexible,
        savings_type,
        annual_yield_rate,
        sync_status,
        version,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localId,
      null,
      ownerType,
      ownerLocalId,
      input.name.trim(),
      input.description?.trim() || null,
      input.target_amount,
      input.current_amount ?? 0,
      input.currency_code,
      input.target_date ?? null,
      input.status ?? "active",
      input.priority_rank ?? 0,
      input.target_monthly_contribution,
      input.is_flexible ? 1 : 0,
      input.savings_type ?? "cash",
      input.annual_yield_rate ?? 0,
      SYNC_STATUS.PENDING,
      1,
      timestamp,
      timestamp,
      null,
    ],
    db,
  );

  const goal = await getGoalByLocalId(localId, db);

  if (!goal) {
    throw new Error("Goal was not found after creation.");
  }

  return goal;
}

async function updateGoal(
  localId: string,
  input: SavingsGoalPlanningInput,
  db?: DatabaseTransaction,
) {
  const existingGoal = await getGoalByLocalId(localId, db);

  if (!existingGoal) {
    return null;
  }

  const timestamp = nowIsoString();

  await execute(
    `
      UPDATE goals
      SET
        name = ?,
        description = ?,
        target_amount = ?,
        current_amount = ?,
        currency_code = ?,
        target_date = ?,
        status = ?,
        priority_rank = ?,
        target_monthly_contribution = ?,
        is_flexible = ?,
        savings_type = ?,
        annual_yield_rate = ?,
        sync_status = ?,
        version = ?,
        updated_at = ?
      WHERE local_id = ?
        AND deleted_at IS NULL
    `,
    [
      input.name.trim(),
      input.description === undefined
        ? existingGoal.description
        : input.description?.trim() || null,
      input.target_amount,
      input.current_amount ?? existingGoal.current_amount,
      input.currency_code,
      input.target_date === undefined ? existingGoal.target_date : input.target_date,
      input.status ?? existingGoal.status,
      input.priority_rank ?? existingGoal.priority_rank,
      input.target_monthly_contribution,
      input.is_flexible === undefined
        ? existingGoal.is_flexible
          ? 1
          : 0
        : input.is_flexible
          ? 1
          : 0,
      input.savings_type ?? existingGoal.savings_type,
      input.annual_yield_rate ?? existingGoal.annual_yield_rate,
      SYNC_STATUS.PENDING,
      existingGoal.version + 1,
      timestamp,
      localId,
    ],
    db,
  );

  return getGoalByLocalId(localId, db);
}

async function upsertGoal(
  ownerType: string,
  ownerLocalId: string,
  input: SavingsGoalPlanningInput,
  db?: DatabaseTransaction,
) {
  if (input.local_id) {
    return updateGoal(input.local_id, input, db);
  }

  return createGoal(ownerType, ownerLocalId, input, db);
}

async function softDeleteGoal(localId: string, db?: DatabaseTransaction) {
  const existingGoal = await getGoalByLocalId(localId, db);

  if (!existingGoal) {
    return false;
  }

  const timestamp = nowIsoString();

  await execute(
    `
      UPDATE goals
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
      existingGoal.version + 1,
      localId,
    ],
    db,
  );

  return true;
}

async function listGoalContributionsByMonth(
  ownerType: string,
  ownerLocalId: string,
  startIso: string,
  endIso: string,
) {
  return getAll<
    GoalContributionRecord & {
      goal_name: string;
    }
  >(
    `
      SELECT
        gc.local_id,
        gc.server_id,
        gc.goal_local_id,
        gc.transaction_local_id,
        gc.amount,
        gc.contributed_at,
        gc.note,
        gc.sync_status,
        gc.version,
        gc.created_at,
        gc.updated_at,
        gc.deleted_at,
        g.name AS goal_name
      FROM goal_contributions gc
      INNER JOIN goals g ON g.local_id = gc.goal_local_id
      WHERE g.owner_type = ?
        AND g.owner_local_id = ?
        AND gc.deleted_at IS NULL
        AND gc.contributed_at >= ?
        AND gc.contributed_at <= ?
      ORDER BY gc.contributed_at ASC
    `,
    [ownerType, ownerLocalId, startIso, endIso],
  ) as Promise<(GoalContribution & { goal_name: string })[]>;
}

export const goalRepository = {
  createGoal,
  getGoalByLocalId,
  listGoalContributionsByMonth,
  listGoalsByOwner,
  softDeleteGoal,
  updateGoal,
  upsertGoal,
};
