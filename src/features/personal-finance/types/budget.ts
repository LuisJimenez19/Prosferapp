import type { BaseEntity, OwnedEntity } from "@/src/types/common";

export type BudgetPlanStatus = "draft" | "active" | "closed";
export type BudgetStrategyType =
  | "priority-based"
  | "zero-based"
  | "income-first";
export type BudgetBufferMode = "fixed_amount" | "percentage";
export type BudgetRole =
  | "income"
  | "essential"
  | "debt_payment"
  | "goal_contribution"
  | "flexible"
  | "ignore";
export type IncomeReliabilityLevel = "fixed" | "variable";
export type BudgetDeviationStatus = "on_track" | "warning" | "off_track";
export type BudgetComparisonMode = "cap" | "target";
export type BudgetComparisonState = "below" | "aligned" | "above";
export type BudgetAlertKind =
  | "essential_overspend"
  | "debt_payment_risk"
  | "goal_progress_risk"
  | "flexible_overspend";
export type BudgetAlertSeverity = "info" | "warning" | "critical";

export interface Budget extends BaseEntity, OwnedEntity {
  name: string;
  budget_period: string;
  amount_limit: number;
  currency_code: string;
  start_date: string;
  end_date: string;
  month_key: string;
  status: BudgetPlanStatus;
  strategy_type: BudgetStrategyType;
  planned_income_total: number;
  planned_essential_total: number;
  planned_debt_total: number;
  planned_goal_total: number;
  planned_flexible_total: number;
  buffer_total: number;
  generated_at: string | null;
}

export type BudgetRecord = Budget;

export interface BudgetCategoryAllocation extends BaseEntity {
  budget_local_id: string;
  category_local_id: string;
  allocated_amount: number;
  priority_order: number;
  is_fixed: boolean;
  expected_day: number | null;
}

export interface BudgetCategoryAllocationRecord
  extends Omit<BudgetCategoryAllocation, "is_fixed"> {
  is_fixed: number;
}

export interface BudgetCategoryAllocationDetail extends BudgetCategoryAllocation {
  category_name: string;
  budget_role: BudgetRole;
}

export interface MonthlyIncomePlanItem extends BaseEntity {
  budget_local_id: string;
  name: string;
  expected_amount: number;
  expected_day: number | null;
  destination_wallet_local_id: string | null;
  is_primary: boolean;
  reliability_level: IncomeReliabilityLevel;
}

export interface MonthlyIncomePlanItemRecord
  extends Omit<MonthlyIncomePlanItem, "is_primary"> {
  is_primary: number;
}

export interface MonthlyIncomePlanningInput {
  local_id?: string;
  name: string;
  expected_amount: number;
  expected_day?: number | null;
  destination_wallet_local_id?: string | null;
  is_primary?: boolean;
  reliability_level?: IncomeReliabilityLevel;
}

export interface EssentialExpensePlanningInput {
  category_local_id: string;
  allocated_amount: number;
  priority_order?: number;
  is_fixed?: boolean;
  expected_day?: number | null;
}

export interface BudgetPreferences {
  strategy_type: BudgetStrategyType;
  buffer_mode: BudgetBufferMode;
  buffer_value: number;
  prioritize_debt_over_goals: boolean;
  allow_flexible_spending: boolean;
  alert_threshold_percentage: number;
  overspend_threshold_amount: number;
  auto_assign_extra_income: boolean;
}

export interface BudgetSetupInput extends OwnedEntity {
  month_key: string;
  currency_code: string;
  monthly_incomes: MonthlyIncomePlanningInput[];
  essential_expenses: EssentialExpensePlanningInput[];
  debts: import("./debt").DebtPlanningInput[];
  savings_goals: import("./goal").SavingsGoalPlanningInput[];
  preferences: BudgetPreferences;
}

export interface GeneratedMonthlyBudgetSummary {
  budget: Budget;
  month_key: string;
  currency_code: string;
  planned_income_total: number;
  actual_income_total: number;
  planned_essential_total: number;
  actual_essential_total: number;
  planned_debt_total: number;
  actual_debt_total: number;
  planned_goal_total: number;
  actual_goal_total: number;
  planned_flexible_total: number;
  actual_flexible_total: number;
  buffer_total: number;
  remaining_to_assign: number;
  remaining_flexible: number;
  deviation_status: BudgetDeviationStatus;
  comparison_blocks: BudgetComparisonBlock[];
  essential_breakdown: EssentialBudgetBreakdownItem[];
}

export interface BudgetAlert {
  kind: BudgetAlertKind;
  severity: BudgetAlertSeverity;
  title: string;
  description: string;
}

export interface BudgetComparisonBlock {
  key: "income" | "essentials" | "debts" | "goals" | "flexible";
  comparison_mode: BudgetComparisonMode;
  state: BudgetComparisonState;
  planned_amount: number;
  actual_amount: number;
  difference_amount: number;
  progress_ratio: number;
}

export interface EssentialBudgetBreakdownItem {
  category_local_id: string;
  category_name: string;
  allocated_amount: number;
  actual_amount: number;
  difference_amount: number;
  progress_ratio: number;
  state: BudgetComparisonState;
}
