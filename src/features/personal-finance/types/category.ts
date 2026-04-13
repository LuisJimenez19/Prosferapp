import type { BaseEntity, OwnedEntity } from '@/src/types/common';
import type { BudgetRole } from './budget';

export type CategoryKind = 'income' | 'expense';

export interface Category extends BaseEntity, OwnedEntity {
  parent_local_id: string | null;
  name: string;
  category_kind: CategoryKind;
  color_hex: string | null;
  icon_name: string | null;
  budget_role: BudgetRole;
  is_essential: boolean;
  is_system: boolean;
  default_goal_local_id: string | null;
  default_debt_local_id: string | null;
}

export interface CategoryRecord extends Omit<Category, 'is_essential' | 'is_system'> {
  is_essential: number;
  is_system: number;
}

export interface CreateCategoryInput extends OwnedEntity {
  parent_local_id?: string | null;
  name: string;
  category_kind: CategoryKind;
  color_hex?: string | null;
  icon_name?: string | null;
  budget_role?: BudgetRole;
  is_essential?: boolean;
  is_system?: boolean;
  default_goal_local_id?: string | null;
  default_debt_local_id?: string | null;
  server_id?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  color_hex?: string | null;
  icon_name?: string | null;
  parent_local_id?: string | null;
  budget_role?: BudgetRole;
  is_essential?: boolean;
  is_system?: boolean;
  default_goal_local_id?: string | null;
  default_debt_local_id?: string | null;
  server_id?: string | null;
}
