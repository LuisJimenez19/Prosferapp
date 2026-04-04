import { getAll, getFirst } from '@/src/database/queries';
import type { Category, CategoryKind, CategoryRecord } from '../types/category';

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
  sync_status,
  version,
  created_at,
  updated_at,
  deleted_at
`;

function mapCategoryRecord(record: CategoryRecord): Category {
  return record;
}

async function getCategoryByLocalId(localId: string) {
  const record = await getFirst<CategoryRecord>(
    `
      SELECT ${CATEGORY_SELECT_FIELDS}
      FROM categories
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [localId],
  );

  if (!record) {
    return null;
  }

  return mapCategoryRecord(record);
}

async function listCategoriesByOwner(ownerType: string, ownerLocalId: string) {
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
  );

  return records.map(mapCategoryRecord);
}

async function listCategoriesByOwnerAndKind(
  ownerType: string,
  ownerLocalId: string,
  categoryKind: CategoryKind,
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
  );

  return records.map(mapCategoryRecord);
}

export const categoryRepository = {
  getCategoryByLocalId,
  listCategoriesByOwner,
  listCategoriesByOwnerAndKind,
};
