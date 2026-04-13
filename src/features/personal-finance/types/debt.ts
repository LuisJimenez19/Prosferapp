import type { BaseEntity, OwnedEntity } from "@/src/types/common";

export type DebtType = "credit_card" | "loan" | "family" | "other";
export type DebtStatus = "active" | "paused" | "closed";

export interface Debt extends BaseEntity, OwnedEntity {
  name: string;
  debt_type: DebtType;
  lender_name: string | null;
  start_date: string | null;
  current_balance: number;
  minimum_payment: number;
  target_payment: number;
  due_day: number | null;
  interest_rate: number | null;
  total_installments: number | null;
  installments_paid: number;
  payoff_target_date: string | null;
  priority_rank: number;
  status: DebtStatus;
}

export type DebtRecord = Debt;

export interface DebtPlanningInput {
  local_id?: string;
  name: string;
  debt_type?: DebtType;
  lender_name?: string | null;
  start_date?: string | null;
  current_balance: number;
  minimum_payment: number;
  target_payment: number;
  due_day?: number | null;
  interest_rate?: number | null;
  total_installments?: number | null;
  installments_paid?: number;
  payoff_target_date?: string | null;
  priority_rank?: number;
  status?: DebtStatus;
}
