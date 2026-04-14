import { execute, getAll, getFirst } from '@/src/database/queries';
import { nowIsoString } from '@/src/lib/dates';
import { generateLocalId } from '@/src/lib/ids';
import type { DatabaseTransaction } from '@/src/types/database';
import { SYNC_STATUS } from '@/src/types/common';
import type {
  Category,
  CategoryKind,
  CategoryRecord,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/category';

const CATEGORY_SELECT_FIELDS = `
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
`;

function mapCategoryRecord(record: CategoryRecord): Category {
  return {
    ...record,
    is_essential: Boolean(record.is_essential),
    is_system: Boolean(record.is_system),
  };
}

async function getCategoryByLocalId(localId: string, db?: DatabaseTransaction) {
  const record = await getFirst<CategoryRecord>(
    `
      SELECT ${CATEGORY_SELECT_FIELDS}
      FROM categories
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

  return mapCategoryRecord(record);
}

async function findCategoryByOwnerKindAndName(
  ownerType: string,
  ownerLocalId: string,
  categoryKind: CategoryKind,
  name: string,
  db?: DatabaseTransaction,
) {
  return getFirst<CategoryRecord>(
    `
      SELECT ${CATEGORY_SELECT_FIELDS}
      FROM categories
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND category_kind = ?
        AND deleted_at IS NULL
        AND LOWER(TRIM(name)) = LOWER(TRIM(?))
      LIMIT 1
    `,
    [ownerType, ownerLocalId, categoryKind, name],
    db,
  );
}

async function listCategoriesByOwner(
  ownerType: string,
  ownerLocalId: string,
  db?: DatabaseTransaction,
) {
  const records = await getAll<CategoryRecord>(
    `
      SELECT ${CATEGORY_SELECT_FIELDS}
      FROM categories
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND deleted_at IS NULL
      ORDER BY category_kind ASC, name ASC
    `,
    [ownerType, ownerLocalId],
    db,
  );

  return records.map(mapCategoryRecord);
}

async function listCategoriesByOwnerAndBudgetRole(
  ownerType: string,
  ownerLocalId: string,
  budgetRole: Category["budget_role"],
  db?: DatabaseTransaction,
) {
  const records = await getAll<CategoryRecord>(
    `
      SELECT ${CATEGORY_SELECT_FIELDS}
      FROM categories
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND budget_role = ?
        AND deleted_at IS NULL
      ORDER BY name ASC
    `,
    [ownerType, ownerLocalId, budgetRole],
    db,
  );

  return records.map(mapCategoryRecord);
}

async function listCategoriesByOwnerAndKind(
  ownerType: string,
  ownerLocalId: string,
  categoryKind: CategoryKind,
  db?: DatabaseTransaction,
) {
  const records = await getAll<CategoryRecord>(
    `
      SELECT ${CATEGORY_SELECT_FIELDS}
      FROM categories
      WHERE owner_type = ?
        AND owner_local_id = ?
        AND category_kind = ?
        AND deleted_at IS NULL
      ORDER BY name ASC
    `,
    [ownerType, ownerLocalId, categoryKind],
    db,
  );

  return records.map(mapCategoryRecord);
}

async function createCategory(input: CreateCategoryInput, db?: DatabaseTransaction) {
  const existingCategory = await findCategoryByOwnerKindAndName(
    input.owner_type,
    input.owner_local_id,
    input.category_kind,
    input.name,
    db,
  );

  if (existingCategory) {
    throw new Error('Category name already exists for this transaction type.');
  }

  const timestamp = nowIsoString();
  const localId = generateLocalId('category');

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
      localId,
      input.server_id ?? null,
      input.owner_type,
      input.owner_local_id,
      input.parent_local_id ?? null,
      input.name.trim(),
      input.category_kind,
      input.color_hex ?? null,
      input.icon_name ?? null,
      input.budget_role ??
        (input.category_kind === "income" ? "income" : "flexible"),
      input.is_essential ? 1 : 0,
      input.is_system ? 1 : 0,
      input.default_goal_local_id ?? null,
      input.default_debt_local_id ?? null,
      SYNC_STATUS.PENDING,
      1,
      timestamp,
      timestamp,
      null,
    ],
    db,
  );

  const category = await getCategoryByLocalId(localId, db);

  if (!category) {
    throw new Error(`Category was not found after creation: ${localId}`);
  }

  return category;
}

async function updateCategory(
  localId: string,
  updates: UpdateCategoryInput,
  db?: DatabaseTransaction,
) {
  const existingCategory = await getCategoryByLocalId(localId, db);

  if (!existingCategory) {
    return null;
  }

  const nextName = updates.name?.trim() ?? existingCategory.name;

  if (nextName.toLowerCase() !== existingCategory.name.trim().toLowerCase()) {
    const duplicateCategory = await findCategoryByOwnerKindAndName(
      existingCategory.owner_type,
      existingCategory.owner_local_id,
      existingCategory.category_kind,
      nextName,
      db,
    );

    if (duplicateCategory && duplicateCategory.local_id !== localId) {
      throw new Error('Category name already exists for this transaction type.');
    }
  }

  const timestamp = nowIsoString();

  await execute(
    `
      UPDATE categories
      SET
        server_id = ?,
        parent_local_id = ?,
        name = ?,
        color_hex = ?,
        icon_name = ?,
        budget_role = ?,
        is_essential = ?,
        is_system = ?,
        default_goal_local_id = ?,
        default_debt_local_id = ?,
        sync_status = ?,
        version = ?,
        updated_at = ?
      WHERE local_id = ?
        AND deleted_at IS NULL
    `,
    [
      updates.server_id === undefined
        ? existingCategory.server_id
        : updates.server_id,
      updates.parent_local_id === undefined
        ? existingCategory.parent_local_id
        : updates.parent_local_id,
      nextName,
      updates.color_hex === undefined
        ? existingCategory.color_hex
        : updates.color_hex,
      updates.icon_name === undefined
        ? existingCategory.icon_name
        : updates.icon_name,
      updates.budget_role ?? existingCategory.budget_role,
      updates.is_essential === undefined
        ? existingCategory.is_essential
          ? 1
          : 0
        : updates.is_essential
          ? 1
          : 0,
      updates.is_system === undefined
        ? existingCategory.is_system
          ? 1
          : 0
        : updates.is_system
          ? 1
          : 0,
      updates.default_goal_local_id === undefined
        ? existingCategory.default_goal_local_id
        : updates.default_goal_local_id,
      updates.default_debt_local_id === undefined
        ? existingCategory.default_debt_local_id
        : updates.default_debt_local_id,
      SYNC_STATUS.PENDING,
      existingCategory.version + 1,
      timestamp,
      localId,
    ],
    db,
  );

  return getCategoryByLocalId(localId, db);
}

async function getCategoryDeleteSummary(localId: string) {
  const [category, transactionUsage] = await Promise.all([
    getCategoryByLocalId(localId),
    getFirst<{ total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM transactions
        WHERE category_local_id = ?
          AND deleted_at IS NULL
      `,
      [localId],
    ),
  ]);

  if (!category) {
    return null;
  }

  return {
    category,
    transaction_count: Number(transactionUsage?.total ?? 0),
  };
}

async function softDeleteCategory(localId: string) {
  const existingCategory = await getFirst<
    Pick<CategoryRecord, 'local_id' | 'version' | 'is_essential' | 'is_system'>
  >(
    `
      SELECT local_id, version, is_system, is_essential
      FROM categories
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [localId],
  );

  if (!existingCategory) {
    return false;
  }

  if (
    Boolean(existingCategory.is_system) &&
    !Boolean(existingCategory.is_essential)
  ) {
    throw new Error('Las categorias predefinidas no se pueden eliminar.');
  }

  const timestamp = nowIsoString();

  await execute(
    `
      UPDATE categories
      SET
        deleted_at = ?,
        updated_at = ?,
        sync_status = ?,
        version = ?
      WHERE local_id = ?
        AND deleted_at IS NULL
    `,
    [timestamp, timestamp, SYNC_STATUS.PENDING, existingCategory.version + 1, localId],
  );

  return true;
}

export const categoryRepository = {
  createCategory,
  findCategoryByOwnerKindAndName,
  getCategoryByLocalId,
  getCategoryDeleteSummary,
  listCategoriesByOwner,
  listCategoriesByOwnerAndBudgetRole,
  listCategoriesByOwnerAndKind,
  softDeleteCategory,
  updateCategory,
};
