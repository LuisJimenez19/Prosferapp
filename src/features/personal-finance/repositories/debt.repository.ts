import { execute, getAll, getFirst } from "@/src/database/queries";
import { nowIsoString } from "@/src/lib/dates";
import { generateLocalId } from "@/src/lib/ids";
import type { DatabaseTransaction } from "@/src/types/database";
import { SYNC_STATUS } from "@/src/types/common";
import type { Debt, DebtPlanningInput, DebtRecord } from "../types/debt";

const DEBT_SELECT_FIELDS = `
  local_id,
  server_id,
  owner_type,
  owner_local_id,
  name,
  debt_type,
  lender_name,
  start_date,
  current_balance,
  minimum_payment,
  target_payment,
  due_day,
  interest_rate,
  total_installments,
  installments_paid,
  payoff_target_date,
  priority_rank,
  status,
  sync_status,
  version,
  created_at,
  updated_at,
  deleted_at
`;

function mapDebtRecord(record: DebtRecord): Debt {
  return record;
}

async function getDebtByLocalId(localId: string, db?: DatabaseTransaction) {
  const record = await getFirst<DebtRecord>(
    `
      SELECT ${DEBT_SELECT_FIELDS}
      FROM debts
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

  return mapDebtRecord(record);
}

async function listDebtsByOwner(
  ownerType: string,
  ownerLocalId: string,
  db?: DatabaseTransaction,
) {
  const records = await getAll<DebtRecord>(
    `
      SELECT ${DEBT_SELECT_FIELDS}
      FROM debts
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND deleted_at IS NULL
      ORDER BY priority_rank ASC, start_date ASC, due_day ASC, created_at ASC
    `,
    [ownerType, ownerLocalId],
    db,
  );

  return records.map(mapDebtRecord);
}

async function createDebt(
  ownerType: string,
  ownerLocalId: string,
  input: DebtPlanningInput,
  db?: DatabaseTransaction,
) {
  const timestamp = nowIsoString();
  const localId = generateLocalId("debt");

  await execute(
    `
      INSERT INTO debts (
        local_id,
        server_id,
        owner_type,
        owner_local_id,
        name,
        debt_type,
        lender_name,
        start_date,
        current_balance,
        minimum_payment,
        target_payment,
        due_day,
        interest_rate,
        total_installments,
        installments_paid,
        payoff_target_date,
        priority_rank,
        status,
        sync_status,
        version,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localId,
      null,
      ownerType,
      ownerLocalId,
      input.name.trim(),
      input.debt_type ?? "other",
      input.lender_name?.trim() || null,
      input.start_date ?? null,
      input.current_balance,
      input.minimum_payment,
      input.target_payment,
      input.due_day ?? null,
      input.interest_rate ?? null,
      input.total_installments ?? null,
      input.installments_paid ?? 0,
      input.payoff_target_date ?? null,
      input.priority_rank ?? 0,
      input.status ?? "active",
      SYNC_STATUS.PENDING,
      1,
      timestamp,
      timestamp,
      null,
    ],
    db,
  );

  const debt = await getDebtByLocalId(localId, db);

  if (!debt) {
    throw new Error("Debt was not found after creation.");
  }

  return debt;
}

async function updateDebt(
  localId: string,
  input: DebtPlanningInput,
  db?: DatabaseTransaction,
) {
  const existingDebt = await getDebtByLocalId(localId, db);

  if (!existingDebt) {
    return null;
  }

  const timestamp = nowIsoString();

  await execute(
    `
      UPDATE debts
      SET
        name = ?,
        debt_type = ?,
        lender_name = ?,
        start_date = ?,
        current_balance = ?,
        minimum_payment = ?,
        target_payment = ?,
        due_day = ?,
        interest_rate = ?,
        total_installments = ?,
        installments_paid = ?,
        payoff_target_date = ?,
        priority_rank = ?,
        status = ?,
        sync_status = ?,
        version = ?,
        updated_at = ?
      WHERE local_id = ?
        AND deleted_at IS NULL
    `,
    [
      input.name.trim(),
      input.debt_type ?? existingDebt.debt_type,
      input.lender_name?.trim() || null,
      input.start_date === undefined ? existingDebt.start_date : input.start_date,
      input.current_balance,
      input.minimum_payment,
      input.target_payment,
      input.due_day === undefined ? existingDebt.due_day : input.due_day,
      input.interest_rate === undefined
        ? existingDebt.interest_rate
        : input.interest_rate,
      input.total_installments ?? existingDebt.total_installments,
      input.installments_paid ?? existingDebt.installments_paid,
      input.payoff_target_date === undefined
        ? existingDebt.payoff_target_date
        : input.payoff_target_date,
      input.priority_rank ?? existingDebt.priority_rank,
      input.status ?? existingDebt.status,
      SYNC_STATUS.PENDING,
      existingDebt.version + 1,
      timestamp,
      localId,
    ],
    db,
  );

  return getDebtByLocalId(localId, db);
}

async function upsertDebt(
  ownerType: string,
  ownerLocalId: string,
  input: DebtPlanningInput,
  db?: DatabaseTransaction,
) {
  if (input.local_id) {
    return updateDebt(input.local_id, input, db);
  }

  return createDebt(ownerType, ownerLocalId, input, db);
}

async function softDeleteDebt(localId: string, db?: DatabaseTransaction) {
  const existingDebt = await getDebtByLocalId(localId, db);

  if (!existingDebt) {
    return false;
  }

  const timestamp = nowIsoString();

  await execute(
    `
      UPDATE debts
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
      existingDebt.version + 1,
      localId,
    ],
    db,
  );

  return true;
}

export const debtRepository = {
  createDebt,
  getDebtByLocalId,
  listDebtsByOwner,
  softDeleteDebt,
  updateDebt,
  upsertDebt,
};
