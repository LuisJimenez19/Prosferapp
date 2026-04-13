import type { BaseEntity, OwnedEntity } from "@/src/types/common";

export type SavingsGoalStatus = "active" | "paused" | "completed";
export type SavingsType = "cash" | "yield_account" | "investment";

export interface SavingsGoal extends BaseEntity, OwnedEntity {
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  currency_code: string;
  target_date: string | null;
  status: SavingsGoalStatus;
  priority_rank: number;
  target_monthly_contribution: number;
  is_flexible: boolean;
  savings_type: SavingsType;
  annual_yield_rate: number;
}

export interface SavingsGoalRecord
  extends Omit<SavingsGoal, "is_flexible"> {
  is_flexible: number;
}

export interface GoalContribution extends BaseEntity {
  goal_local_id: string;
  transaction_local_id: string | null;
  amount: number;
  contributed_at: string;
  note: string | null;
}

export type GoalContributionRecord = GoalContribution;

export interface SavingsGoalPlanningInput {
  local_id?: string;
  name: string;
  description?: string | null;
  target_amount: number;
  current_amount?: number;
  currency_code: string;
  target_date?: string | null;
  status?: SavingsGoalStatus;
  priority_rank?: number;
  target_monthly_contribution: number;
  is_flexible?: boolean;
  savings_type?: SavingsType;
  annual_yield_rate?: number;
}
