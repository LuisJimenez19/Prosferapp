import { nowIsoString } from '@/src/lib/dates';
import { generateLocalId } from '@/src/lib/ids';
import { execute, getAll, getFirst, withTransaction } from '@/src/database/queries';
import { SYNC_STATUS } from '@/src/types/common';
import type { CategoryRecord } from '../types/category';
import type {
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

function mapTransactionRecord(record: TransactionRecord): Transaction {
  return record;
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
        c.name AS category_name
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
        null,
        null,
        SYNC_STATUS.PENDING,
        1,
        timestamp,
        timestamp,
        null,
      ],
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
};
