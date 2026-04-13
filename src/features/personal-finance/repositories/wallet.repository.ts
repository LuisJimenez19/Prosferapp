import { nowIsoString } from '@/src/lib/dates';
import { generateLocalId } from '@/src/lib/ids';
import { execute, getAll, getFirst, withTransaction } from '@/src/database/queries';
import { SYNC_STATUS } from '@/src/types/common';
import type {
  CreateWalletInput,
  UpdateWalletInput,
  Wallet,
  WalletOwnerFilter,
  WalletRecord,
} from '../types/wallet';

const WALLET_SELECT_FIELDS = `
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
`;

function mapWalletRecord(record: WalletRecord): Wallet {
  return {
    ...record,
    is_default: Boolean(record.is_default),
  };
}

async function countWalletsByOwner(filter: WalletOwnerFilter, db?: Parameters<typeof execute>[2]) {
  const result = await getFirst<{ total: number }>(
    `
      SELECT COUNT(*) AS total
      FROM wallets
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND deleted_at IS NULL
    `,
    [filter.owner_type, filter.owner_local_id],
    db,
  );

  return Number(result?.total ?? 0);
}

async function clearDefaultWalletForOwner(
  filter: WalletOwnerFilter,
  timestamp: string,
  excludeLocalId?: string,
  db?: Parameters<typeof execute>[2],
) {
  const query = excludeLocalId
    ? `
        UPDATE wallets
        SET
          is_default = 0,
          updated_at = ?,
          sync_status = ?,
          version = version + 1
        WHERE owner_type = ?
          AND owner_local_id = ?
          AND deleted_at IS NULL
          AND local_id != ?
          AND is_default = 1
      `
    : `
        UPDATE wallets
        SET
          is_default = 0,
          updated_at = ?,
          sync_status = ?,
          version = version + 1
        WHERE owner_type = ?
          AND owner_local_id = ?
          AND deleted_at IS NULL
          AND is_default = 1
      `;

  const params = excludeLocalId
    ? [timestamp, SYNC_STATUS.PENDING, filter.owner_type, filter.owner_local_id, excludeLocalId]
    : [timestamp, SYNC_STATUS.PENDING, filter.owner_type, filter.owner_local_id];

  await execute(query, params, db);
}

async function getWalletRecordByLocalId(localId: string) {
  return getFirst<WalletRecord>(
    `
      SELECT ${WALLET_SELECT_FIELDS}
      FROM wallets
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [localId],
  );
}

async function getWalletByLocalId(localId: string) {
  const record = await getWalletRecordByLocalId(localId);

  if (!record) {
    return null;
  }

  return mapWalletRecord(record);
}

async function listWalletsByOwner(filter: WalletOwnerFilter) {
  const records = await getAll<WalletRecord>(
    `
      SELECT ${WALLET_SELECT_FIELDS}
      FROM wallets
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND deleted_at IS NULL
      ORDER BY is_default DESC, created_at ASC
    `,
    [filter.owner_type, filter.owner_local_id],
  );

  return records.map(mapWalletRecord);
}

async function getWalletDeleteSummary(localId: string) {
  const wallet = await getWalletByLocalId(localId);

  if (!wallet) {
    return null;
  }

  const [transactionUsage, ownerWalletCount] = await Promise.all([
    getFirst<{ total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM transactions
        WHERE wallet_local_id = ?
          AND deleted_at IS NULL
      `,
      [localId],
    ),
    getFirst<{ total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM wallets
        WHERE owner_type = ?
          AND owner_local_id = ?
          AND deleted_at IS NULL
          AND local_id != ?
      `,
      [wallet.owner_type, wallet.owner_local_id, localId],
    ),
  ]);

  return {
    wallet,
    remaining_wallet_count: Number(ownerWalletCount?.total ?? 0),
    transaction_count: Number(transactionUsage?.total ?? 0),
  };
}

async function createWallet(input: CreateWalletInput) {
  const timestamp = nowIsoString();
  const localId = generateLocalId('wallet');
  const initialBalance = input.initial_balance ?? 0;
  const currentBalance = input.current_balance ?? initialBalance;
  await withTransaction(async (db) => {
    const existingWalletCount = await countWalletsByOwner(input, db);
    const isDefault = input.is_default ?? existingWalletCount === 0;

    if (isDefault) {
      await clearDefaultWalletForOwner(input, timestamp, undefined, db);
    }

    await execute(
      `
        INSERT INTO wallets (
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        localId,
        input.server_id ?? null,
        input.owner_type,
        input.owner_local_id,
        input.name,
        input.wallet_type,
        input.currency_code,
        initialBalance,
        currentBalance,
        isDefault ? 1 : 0,
        SYNC_STATUS.PENDING,
        1,
        timestamp,
        timestamp,
        null,
      ],
      db,
    );

    return true;
  });

  const wallet = await getWalletByLocalId(localId);

  if (!wallet) {
    throw new Error(`Wallet was not found after creation: ${localId}`);
  }

  return wallet;
}

async function updateWallet(localId: string, updates: UpdateWalletInput) {
  const existingWallet = await getWalletRecordByLocalId(localId);

  if (!existingWallet) {
    return null;
  }

  const timestamp = nowIsoString();
  const nextIsDefault =
    updates.is_default === undefined ? Boolean(existingWallet.is_default) : updates.is_default;

  await withTransaction(async (db) => {
    if (nextIsDefault) {
      await execute(
        `
          UPDATE wallets
          SET
            is_default = 0,
            updated_at = ?,
            sync_status = ?,
            version = version + 1
          WHERE owner_type = ?
            AND owner_local_id = ?
            AND deleted_at IS NULL
            AND local_id != ?
            AND is_default = 1
        `,
        [
          timestamp,
          SYNC_STATUS.PENDING,
          existingWallet.owner_type,
          existingWallet.owner_local_id,
          localId,
        ],
        db,
      );
    }

    await execute(
      `
        UPDATE wallets
        SET
          server_id = ?,
          name = ?,
          wallet_type = ?,
          currency_code = ?,
          initial_balance = ?,
          current_balance = ?,
          is_default = ?,
          sync_status = ?,
          version = ?,
          updated_at = ?
        WHERE local_id = ?
          AND deleted_at IS NULL
      `,
      [
        updates.server_id ?? existingWallet.server_id,
        updates.name ?? existingWallet.name,
        updates.wallet_type ?? existingWallet.wallet_type,
        updates.currency_code ?? existingWallet.currency_code,
        updates.initial_balance ?? existingWallet.initial_balance,
        updates.current_balance ?? existingWallet.current_balance,
        nextIsDefault ? 1 : 0,
        SYNC_STATUS.PENDING,
        existingWallet.version + 1,
        timestamp,
        localId,
      ],
      db,
    );
  });

  return getWalletByLocalId(localId);
}

async function softDeleteWallet(localId: string) {
  const existingWallet = await getFirst<
    Pick<WalletRecord, 'local_id' | 'version' | 'owner_type' | 'owner_local_id' | 'is_default'>
  >(
    `
      SELECT local_id, version, owner_type, owner_local_id, is_default
      FROM wallets
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [localId],
  );

  if (!existingWallet) {
    return false;
  }

  const timestamp = nowIsoString();
  await withTransaction(async (db) => {
    await execute(
      `
        UPDATE wallets
        SET
          deleted_at = ?,
          updated_at = ?,
          sync_status = ?,
          version = ?
        WHERE local_id = ?
          AND deleted_at IS NULL
      `,
      [timestamp, timestamp, SYNC_STATUS.PENDING, existingWallet.version + 1, localId],
      db,
    );

    if (Boolean(existingWallet.is_default)) {
      const replacementWallet = await getFirst<Pick<WalletRecord, 'local_id' | 'version'>>(
        `
          SELECT local_id, version
          FROM wallets
          WHERE owner_type = ?
            AND owner_local_id = ?
            AND local_id != ?
            AND deleted_at IS NULL
          ORDER BY created_at ASC
          LIMIT 1
        `,
        [existingWallet.owner_type, existingWallet.owner_local_id, localId],
        db,
      );

      if (replacementWallet) {
        await execute(
          `
            UPDATE wallets
            SET
              is_default = 1,
              updated_at = ?,
              sync_status = ?,
              version = ?
            WHERE local_id = ?
              AND deleted_at IS NULL
          `,
          [
            timestamp,
            SYNC_STATUS.PENDING,
            replacementWallet.version + 1,
            replacementWallet.local_id,
          ],
          db,
        );
      }
    }

    return true;
  });

  return true;
}

export const walletRepository = {
  createWallet,
  getWalletByLocalId,
  getWalletDeleteSummary,
  listWalletsByOwner,
  updateWallet,
  softDeleteWallet,
};
