import { nowIsoString } from '@/src/lib/dates';
import { generateLocalId } from '@/src/lib/ids';
import { execute, getAll, getFirst } from '@/src/database/queries';
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

async function createWallet(input: CreateWalletInput) {
  const timestamp = nowIsoString();
  const localId = generateLocalId('wallet');
  const initialBalance = input.initial_balance ?? 0;
  const currentBalance = input.current_balance ?? initialBalance;
  const isDefault = input.is_default ?? false;

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
  );

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
      updates.is_default === undefined ? existingWallet.is_default : updates.is_default ? 1 : 0,
      SYNC_STATUS.PENDING,
      existingWallet.version + 1,
      timestamp,
      localId,
    ],
  );

  return getWalletByLocalId(localId);
}

async function softDeleteWallet(localId: string) {
  const existingWallet = await getFirst<Pick<WalletRecord, 'local_id' | 'version'>>(
    `
      SELECT local_id, version
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
  );

  return true;
}

export const walletRepository = {
  createWallet,
  getWalletByLocalId,
  listWalletsByOwner,
  updateWallet,
  softDeleteWallet,
};
