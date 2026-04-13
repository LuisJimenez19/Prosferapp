import { nowIsoString } from '@/src/lib/dates';
import { generateLocalId } from '@/src/lib/ids';
import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import { execute, getFirst, withTransaction } from './queries';
import { SYNC_STATUS } from '@/src/types/common';

const INITIAL_SEED_VERSION = '1';
const SEED_SETTING_KEY = 'initial_seed_version';
const ACTIVE_USER_SETTING_KEY = 'active_user_local_id';
const ACTIVE_PROFILE_SETTING_KEY = 'active_personal_profile_local_id';

const DEFAULT_CATEGORIES = [
  {
    name: 'Sueldo',
    category_kind: 'income',
    budget_role: 'income',
    is_essential: 0,
    is_system: 0,
  },
  {
    name: 'Otros ingresos',
    category_kind: 'income',
    budget_role: 'income',
    is_essential: 0,
    is_system: 0,
  },
  {
    name: 'Comida',
    category_kind: 'expense',
    budget_role: 'essential',
    is_essential: 1,
    is_system: 1,
  },
  {
    name: 'Transporte',
    category_kind: 'expense',
    budget_role: 'essential',
    is_essential: 1,
    is_system: 1,
  },
  {
    name: 'Salud',
    category_kind: 'expense',
    budget_role: 'essential',
    is_essential: 1,
    is_system: 1,
  },
  {
    name: 'Entretenimiento',
    category_kind: 'expense',
    budget_role: 'flexible',
    is_essential: 0,
    is_system: 0,
  },
  {
    name: 'Varios',
    category_kind: 'expense',
    budget_role: 'flexible',
    is_essential: 0,
    is_system: 0,
  },
] as const;

const DEFAULT_WALLETS = [
  { name: 'Efectivo', wallet_type: 'cash', is_default: 1 },
  { name: 'Banco', wallet_type: 'bank', is_default: 0 },
] as const;

async function hasInitialSeed() {
  const result = await getFirst<{ setting_value: string }>(
    `
      SELECT setting_value
      FROM app_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [SEED_SETTING_KEY],
  );

  return result?.setting_value === INITIAL_SEED_VERSION;
}

export async function seedInitialData() {
  const seeded = await hasInitialSeed();

  if (seeded) {
    return;
  }

  await withTransaction(async (db) => {
    const existingSeed = await getFirst<{ setting_value: string }>(
      `
        SELECT setting_value
        FROM app_settings
        WHERE setting_key = ?
        LIMIT 1
      `,
      [SEED_SETTING_KEY],
      db,
    );

    if (existingSeed?.setting_value === INITIAL_SEED_VERSION) {
      return;
    }

    const timestamp = nowIsoString();
    const userLocalId = generateLocalId('user');
    const profileLocalId = generateLocalId('profile');

    await execute(
      `
        INSERT INTO users (
          local_id,
          server_id,
          email,
          phone,
          display_name,
          preferred_currency,
          timezone,
          sync_status,
          version,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userLocalId,
        null,
        null,
        null,
        'Local User',
        DEFAULT_CURRENCY_CODE,
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
        INSERT INTO personal_profiles (
          local_id,
          server_id,
          user_local_id,
          full_name,
          country_code,
          default_wallet_local_id,
          birth_date,
          sync_status,
          version,
          created_at,
          updated_at,
          deleted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        profileLocalId,
        null,
        userLocalId,
        'Main Profile',
        null,
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

    let defaultWalletLocalId: string | null = null;

    for (const wallet of DEFAULT_WALLETS) {
      const walletLocalId = generateLocalId('wallet');

      if (wallet.is_default === 1) {
        defaultWalletLocalId = walletLocalId;
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
          walletLocalId,
          null,
          'personal',
          profileLocalId,
          wallet.name,
          wallet.wallet_type,
          DEFAULT_CURRENCY_CODE,
          0,
          0,
          wallet.is_default,
          SYNC_STATUS.PENDING,
          1,
          timestamp,
          timestamp,
          null,
        ],
        db,
      );
    }

    if (defaultWalletLocalId) {
      await execute(
        `
          UPDATE personal_profiles
          SET default_wallet_local_id = ?, updated_at = ?
          WHERE local_id = ?
        `,
        [defaultWalletLocalId, timestamp, profileLocalId],
        db,
      );
    }

    for (const category of DEFAULT_CATEGORIES) {
      await execute(
        `
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          generateLocalId('category'),
          null,
          'personal',
          profileLocalId,
          null,
          category.name,
          category.category_kind,
          null,
            null,
            category.budget_role,
            category.is_essential,
            category.is_system,
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
    }

    const settings = [
      { key: ACTIVE_USER_SETTING_KEY, value: userLocalId },
      { key: ACTIVE_PROFILE_SETTING_KEY, value: profileLocalId },
      { key: SEED_SETTING_KEY, value: INITIAL_SEED_VERSION },
    ];

    for (const setting of settings) {
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
        [generateLocalId('setting'), setting.key, setting.value, 'string', timestamp],
        db,
      );
    }

    return true;
  });
}
