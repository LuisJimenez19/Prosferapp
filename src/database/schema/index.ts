import type { MigrationDefinition } from '@/src/types/database';

import { migration001Base } from './001_base';
import { migration002Business } from './002_business';
import { migration003Inventory } from './003_inventory';
import { migration004BudgetPlanning } from './004_budget_planning';
import { migration005BudgetFeatureExpansion } from './005_budget_feature_expansion';
import { migration006BudgetSectionPlanning } from './006_budget_section_planning';
import { migration007EditableEssentialDefaults } from './007_editable_essential_defaults';

export const schemaMigrations: MigrationDefinition[] = [
  migration001Base,
  migration002Business,
  migration003Inventory,
  migration004BudgetPlanning,
  migration005BudgetFeatureExpansion,
  migration006BudgetSectionPlanning,
  migration007EditableEssentialDefaults,
];
