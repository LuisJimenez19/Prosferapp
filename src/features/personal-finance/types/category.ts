import type { BaseEntity, OwnedEntity } from '@/src/types/common';

export type CategoryKind = 'income' | 'expense';

export interface Category extends BaseEntity, OwnedEntity {
  parent_local_id: string | null;
  name: string;
  category_kind: CategoryKind;
  color_hex: string | null;
  icon_name: string | null;
}

export type CategoryRecord = Category;
