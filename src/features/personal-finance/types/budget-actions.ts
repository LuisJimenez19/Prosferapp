export type BudgetPlannedActionKind =
  | "income"
  | "essential"
  | "debt"
  | "goal";

export type BudgetPlannedActionStatus =
  | "ready"
  | "scheduled"
  | "recorded";

export type BudgetPlannedActionReferenceType =
  | "budget_income"
  | "budget_essential"
  | "debt"
  | "goal";

export type BudgetPlannedAction = {
  id: string;
  amount: number;
  category_local_id: string;
  category_name: string;
  default_date: string;
  default_note: string;
  default_wallet_local_id: string | null;
  description: string;
  kind: BudgetPlannedActionKind;
  recorded_at: string | null;
  recorded_transaction_local_id: string | null;
  recorded_wallet_name: string | null;
  reference_local_id: string;
  reference_type: BudgetPlannedActionReferenceType;
  scheduled_date: string | null;
  status: BudgetPlannedActionStatus;
  title: string;
};

export type BudgetPlannedActionSummary = {
  pending_total_amount: number;
  ready_count: number;
  recorded_count: number;
  scheduled_count: number;
};
