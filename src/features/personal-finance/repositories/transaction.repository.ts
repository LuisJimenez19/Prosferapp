import { nowIsoString } from '@/src/lib/dates';
import { generateLocalId } from '@/src/lib/ids';
import { execute, getAll, getFirst, withTransaction } from '@/src/database/queries';
import { SYNC_STATUS } from '@/src/types/common';
import type { CategoryRecord } from '../types/category';
import type { DebtRecord } from '../types/debt';
import type { SavingsGoalRecord } from '../types/goal';
import type {
  BudgetTransactionListItem,
  CreateTransactionInput,
  Transaction,
  TransactionListItem,
  TransactionRecord,
} from '../types/transaction';
import type { WalletRecord } from '../types/wallet';

const TRANSACTION_SELECT_FIELDS = `
  t.local_id,
  t.server_id,
  t.owner_type,
  t.owner_local_id,
  t.wallet_local_id,
  t.category_local_id,
  t.related_sale_local_id,
  t.related_purchase_local_id,
  t.transaction_type,
  t.direction,
  t.amount,
  t.currency_code,
  t.occurred_at,
  t.note,
  t.reference_type,
  t.reference_local_id,
  t.sync_status,
  t.version,
  t.created_at,
  t.updated_at,
  t.deleted_at
`;

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

function mapTransactionRecord(record: TransactionRecord): Transaction {
  return record;
}

async function applyReferenceSideEffects(input: {
  amount: number;
  occurred_at: string;
  note: string | null;
  owner_local_id: string;
  owner_type: string;
  reference_local_id: string | null;
  reference_type: string | null;
  transaction_local_id: string;
  transaction_type: CreateTransactionInput['transaction_type'];
  timestamp: string;
}, db: Parameters<typeof execute>[2]) {
  if (
    input.transaction_type !== 'expense' ||
    !input.reference_type ||
    !input.reference_local_id
  ) {
    return;
  }

  if (input.reference_type === 'debt') {
    const debt = await getFirst<DebtRecord>(
      `
        SELECT ${DEBT_SELECT_FIELDS}
        FROM debts
        WHERE local_id = ?
          AND owner_type = ?
          AND owner_local_id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [input.reference_local_id, input.owner_type, input.owner_local_id],
      db,
    );

    if (!debt) {
      return;
    }

    const nextInstallmentsPaid =
      debt.total_installments !== null
        ? Math.min(debt.installments_paid + 1, debt.total_installments)
        : debt.installments_paid;

    await execute(
      `
        UPDATE debts
        SET
          current_balance = ?,
          installments_paid = ?,
          status = ?,
          sync_status = ?,
          version = ?,
          updated_at = ?
        WHERE local_id = ?
          AND deleted_at IS NULL
      `,
      [
        Math.max(debt.current_balance - input.amount, 0),
        nextInstallmentsPaid,
        Math.max(debt.current_balance - input.amount, 0) <= 0 ? 'closed' : debt.status,
        SYNC_STATUS.PENDING,
        debt.version + 1,
        input.timestamp,
        debt.local_id,
      ],
      db,
    );

    return;
  }

  if (input.reference_type !== 'goal') {
    return;
  }

  const goal = await getFirst<SavingsGoalRecord>(
    `
      SELECT ${GOAL_SELECT_FIELDS}
      FROM goals
      WHERE local_id = ?
        AND owner_type = ?
        AND owner_local_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [input.reference_local_id, input.owner_type, input.owner_local_id],
    db,
  );

  if (!goal) {
    return;
  }

  const nextCurrentAmount = goal.current_amount + input.amount;
  const nextStatus = nextCurrentAmount >= goal.target_amount ? 'completed' : goal.status;

  await execute(
    `
      UPDATE goals
      SET
        current_amount = ?,
        status = ?,
        sync_status = ?,
        version = ?,
        updated_at = ?
      WHERE local_id = ?
        AND deleted_at IS NULL
    `,
    [
      nextCurrentAmount,
      nextStatus,
      SYNC_STATUS.PENDING,
      goal.version + 1,
      input.timestamp,
      goal.local_id,
    ],
    db,
  );

  await execute(
    `
      INSERT INTO goal_contributions (
        local_id,
        server_id,
        goal_local_id,
        transaction_local_id,
        amount,
        contributed_at,
        note,
        sync_status,
        version,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      generateLocalId('goal_contribution'),
      null,
      goal.local_id,
      input.transaction_local_id,
      input.amount,
      input.occurred_at,
      input.note,
      SYNC_STATUS.PENDING,
      1,
      input.timestamp,
      input.timestamp,
      null,
    ],
    db,
  );
}

async function getTransactionByLocalId(localId: string) {
  const record = await getFirst<TransactionRecord>(
    `
      SELECT ${TRANSACTION_SELECT_FIELDS}
      FROM transactions t
      WHERE t.local_id = ?
        AND t.deleted_at IS NULL
      LIMIT 1
    `,
    [localId],
  );

  if (!record) {
    return null;
  }

  return mapTransactionRecord(record);
}

async function listRecentTransactionsByOwner(ownerType: string, ownerLocalId: string, limit = 8) {
  return getAll<TransactionListItem>(
    `
      SELECT
        ${TRANSACTION_SELECT_FIELDS},
        w.name AS wallet_name,
        c.name AS category_name,
        c.budget_role AS category_budget_role
      FROM transactions t
      INNER JOIN wallets w ON w.local_id = t.wallet_local_id
      LEFT JOIN categories c ON c.local_id = t.category_local_id
      WHERE t.owner_type = ?
        AND t.owner_local_id = ?
        AND t.deleted_at IS NULL
      ORDER BY t.occurred_at DESC, t.created_at DESC
      LIMIT ?
    `,
    [ownerType, ownerLocalId, limit],
  );
}

async function listTransactionsByOwner(ownerType: string, ownerLocalId: string) {
  return getAll<TransactionListItem>(
    `
      SELECT
        ${TRANSACTION_SELECT_FIELDS},
        w.name AS wallet_name,
        c.name AS category_name,
        c.budget_role AS category_budget_role
      FROM transactions t
      INNER JOIN wallets w ON w.local_id = t.wallet_local_id
      LEFT JOIN categories c ON c.local_id = t.category_local_id
      WHERE t.owner_type = ?
        AND t.owner_local_id = ?
        AND t.deleted_at IS NULL
      ORDER BY t.occurred_at DESC, t.created_at DESC
    `,
    [ownerType, ownerLocalId],
  );
}

async function listTransactionsByOwnerAndDateRange(
  ownerType: string,
  ownerLocalId: string,
  startIso: string,
  endIso: string,
) {
  return getAll<BudgetTransactionListItem>(
    `
      SELECT
        ${TRANSACTION_SELECT_FIELDS},
        w.name AS wallet_name,
        c.name AS category_name,
        c.budget_role AS category_budget_role
      FROM transactions t
      INNER JOIN wallets w ON w.local_id = t.wallet_local_id
      LEFT JOIN categories c ON c.local_id = t.category_local_id
      WHERE t.owner_type = ?
        AND t.owner_local_id = ?
        AND t.deleted_at IS NULL
        AND t.occurred_at >= ?
        AND t.occurred_at <= ?
      ORDER BY t.occurred_at ASC, t.created_at ASC
    `,
    [ownerType, ownerLocalId, startIso, endIso],
  );
}

async function createTransaction(input: CreateTransactionInput) {
  if (input.amount <= 0) {
    throw new Error('Transaction amount must be greater than zero.');
  }

  const transactionLocalId = generateLocalId('transaction');

  await withTransaction(async (db) => {
    const [wallet, category] = await Promise.all([
      getFirst<WalletRecord>(
        `
          SELECT
            local_id,
            server_id,
            owner_type,
            owner_local_id,
            name,
            wallet_type,
            currency_code,
            initial_balance,
            current_balance,
            is_default,
            sync_status,
            version,
            created_at,
            updated_at,
            deleted_at
          FROM wallets
          WHERE local_id = ?
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [input.wallet_local_id],
        db,
      ),
      getFirst<CategoryRecord>(
        `
          SELECT
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
          FROM categories
          WHERE local_id = ?
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [input.category_local_id],
        db,
      ),
    ]);

    if (!wallet) {
      throw new Error('Selected wallet was not found.');
    }

    if (!category) {
      throw new Error('Selected category was not found.');
    }

    if (wallet.owner_type !== input.owner_type || wallet.owner_local_id !== input.owner_local_id) {
      throw new Error('Selected wallet does not belong to the active owner.');
    }

    if (category.owner_type !== input.owner_type || category.owner_local_id !== input.owner_local_id) {
      throw new Error('Selected category does not belong to the active owner.');
    }

    if (category.category_kind !== input.transaction_type) {
      throw new Error('Selected category does not match the transaction type.');
    }

    const timestamp = nowIsoString();
    const balanceDelta = input.transaction_type === 'income' ? input.amount : -input.amount;
    const referenceType =
      input.reference_type ??
      (category.default_debt_local_id
        ? 'debt'
        : category.default_goal_local_id
          ? 'goal'
          : null);
    const referenceLocalId =
      input.reference_local_id ??
      category.default_debt_local_id ??
      category.default_goal_local_id ??
      null;

    await execute(
      `
        INSERT INTO transactions (
          local_id,
          server_id,
          owner_type,
          owner_local_id,
          wallet_local_id,
          category_local_id,
          related_sale_local_id,
          related_purchase_local_id,
          transaction_type,
          direction,
          amount,
          currency_code,
          occurred_at,
          note,
          reference_type,
          reference_local_id,
          sync_status,
          version,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        transactionLocalId,
        null,
        input.owner_type,
        input.owner_local_id,
        input.wallet_local_id,
        input.category_local_id,
        null,
        null,
        input.transaction_type,
        input.transaction_type,
        input.amount,
        input.currency_code ?? wallet.currency_code,
        input.occurred_at,
        input.note?.trim() || null,
        referenceType,
        referenceLocalId,
        SYNC_STATUS.PENDING,
        1,
        timestamp,
        timestamp,
        null,
      ],
      db,
    );

    await applyReferenceSideEffects(
      {
        amount: input.amount,
        occurred_at: input.occurred_at,
        note: input.note?.trim() || null,
        owner_local_id: input.owner_local_id,
        owner_type: input.owner_type,
        reference_local_id: referenceLocalId,
        reference_type: referenceType,
        timestamp,
        transaction_local_id: transactionLocalId,
        transaction_type: input.transaction_type,
      },
      db,
    );

    await execute(
      `
        UPDATE wallets
        SET
          current_balance = ?,
          sync_status = ?,
          version = ?,
          updated_at = ?
        WHERE local_id = ?
          AND deleted_at IS NULL
      `,
      [
        wallet.current_balance + balanceDelta,
        SYNC_STATUS.PENDING,
        wallet.version + 1,
        timestamp,
        wallet.local_id,
      ],
      db,
    );

    return true;
  });

  const createdTransaction = await getTransactionByLocalId(transactionLocalId);

  if (!createdTransaction) {
    throw new Error('Transaction was not found after creation.');
  }

  return createdTransaction;
}

export const transactionRepository = {
  createTransaction,
  getTransactionByLocalId,
  listRecentTransactionsByOwner,
  listTransactionsByOwner,
  listTransactionsByOwnerAndDateRange,
};
