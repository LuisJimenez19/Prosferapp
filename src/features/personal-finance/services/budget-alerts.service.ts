import { getDayOfMonth, getMonthDateRange } from "@/src/lib/dates";
import type {
  BudgetAlert,
  BudgetPreferences,
  GeneratedMonthlyBudgetSummary,
} from "../types/budget";
import type { Debt } from "../types/debt";
import type { SavingsGoal } from "../types/goal";
import { isDebtActiveForMonth } from "./planning-insights";

type BuildBudgetAlertsInput = {
  summary: GeneratedMonthlyBudgetSummary;
  preferences: BudgetPreferences;
  debts: Debt[];
  goals: SavingsGoal[];
  now?: Date;
};

export function buildBudgetAlerts({
  summary,
  preferences,
  debts,
  goals,
  now = new Date(),
}: BuildBudgetAlertsInput) {
  const alerts: BudgetAlert[] = [];
  const overspendBuffer = Math.max(preferences.overspend_threshold_amount, 0);

  if (
    summary.actual_essential_total >
    summary.planned_essential_total + overspendBuffer
  ) {
    alerts.push({
      kind: "essential_overspend",
      severity: "critical",
      title: "Gastos esenciales por encima del plan",
      description:
        "Tus gastos esenciales ya superaron lo que habias reservado para este mes.",
    });
  }

  if (
    summary.planned_flexible_total > 0 &&
    summary.actual_flexible_total >
      summary.planned_flexible_total + overspendBuffer
  ) {
    alerts.push({
      kind: "flexible_overspend",
      severity: "warning",
      title: "Gasto flexible por encima del margen",
      description:
        "Tu gasto flexible ya esta consumiendo mas margen del que el plan contemplaba.",
    });
  }

  const currentDay = getDayOfMonth(now);
  const dueDebtMinimumTotal = debts
    .filter(
      (debt) =>
        debt.status === "active" &&
        isDebtActiveForMonth({
          dueDay: debt.due_day,
          monthKey: summary.month_key,
          startDate: debt.start_date,
        }) &&
        debt.due_day !== null &&
        debt.due_day <= currentDay,
    )
    .reduce((sum, debt) => sum + debt.minimum_payment, 0);

  if (dueDebtMinimumTotal > 0 && summary.actual_debt_total < dueDebtMinimumTotal) {
    alerts.push({
      kind: "debt_payment_risk",
      severity: "critical",
      title: "Pagos de deuda en riesgo",
      description:
        "Ya vencieron pagos minimos del mes y lo registrado todavia no alcanza ese objetivo.",
    });
  }

  const monthProgress =
    getDayOfMonth(now) / getMonthDateRange(summary.month_key).days_in_month;
  const activeGoalTargetByNow = goals
    .filter((goal) => goal.status === "active")
    .reduce(
      (sum, goal) =>
        sum + goal.target_monthly_contribution * Math.min(monthProgress, 1),
      0,
    );

  if (
    activeGoalTargetByNow > 0 &&
    summary.actual_goal_total <
      activeGoalTargetByNow * (1 - preferences.alert_threshold_percentage / 100)
  ) {
    alerts.push({
      kind: "goal_progress_risk",
      severity: "warning",
      title: "Metas de ahorro por debajo del ritmo esperado",
      description:
        "Lo ahorrado este mes va por debajo del ritmo sugerido por tu plan.",
    });
  }

  return alerts;
}

export const budgetAlertsService = {
  buildBudgetAlerts,
};
