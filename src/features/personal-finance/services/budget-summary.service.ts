import { getMonthDateRange, getMonthKey } from "@/src/lib/dates";
import { budgetPreferencesRepository } from "../repositories/budget-preferences.repository";
import { budgetRepository } from "../repositories/budget.repository";
import { debtRepository } from "../repositories/debt.repository";
import { goalRepository } from "../repositories/goal.repository";
import { transactionRepository } from "../repositories/transaction.repository";
import { budgetAlertsService } from "./budget-alerts.service";
import type {
  Budget,
  GeneratedMonthlyBudgetSummary,
} from "../types/budget";

function calculateDeviationStatus(
  budget: Budget,
  actualEssentialTotal: number,
  actualDebtTotal: number,
  actualGoalTotal: number,
  actualFlexibleTotal: number,
) {
  const essentialExceeded = actualEssentialTotal > budget.planned_essential_total;
  const debtBehind =
    budget.planned_debt_total > 0 && actualDebtTotal < budget.planned_debt_total;
  const flexibleExceeded = actualFlexibleTotal > budget.planned_flexible_total;
  const goalsBehind =
    budget.planned_goal_total > 0 && actualGoalTotal < budget.planned_goal_total;

  if (essentialExceeded || flexibleExceeded) {
    return "off_track" as const;
  }

  if (debtBehind || goalsBehind) {
    return "warning" as const;
  }

  return "on_track" as const;
}

export async function getMonthlyBudgetSummary(
  ownerType: string,
  ownerLocalId: string,
  monthKey: string,
) {
  const budget = await budgetRepository.getBudgetByMonth(
    ownerType,
    ownerLocalId,
    monthKey,
  );

  if (!budget) {
    return null;
  }

  const range = getMonthDateRange(budget.month_key);
  const [transactions, budgetCategoryAllocations, goalContributions] =
    await Promise.all([
      transactionRepository.listTransactionsByOwnerAndDateRange(
        ownerType,
        ownerLocalId,
        range.start_iso,
        range.end_iso,
      ),
      budgetRepository.listBudgetCategoryAllocations(budget.local_id),
      goalRepository.listGoalContributionsByMonth(
        ownerType,
        ownerLocalId,
        range.start_iso,
        range.end_iso,
      ),
    ]);

  const essentialCategoryIds = new Set(
    budgetCategoryAllocations.map((allocation) => allocation.category_local_id),
  );

  let actualIncomeTotal = 0;
  let actualEssentialTotal = 0;
  let actualDebtTotal = 0;
  let actualGoalTotal = 0;
  let actualFlexibleTotal = 0;

  for (const transaction of transactions) {
    if (transaction.transaction_type === "income") {
      actualIncomeTotal += transaction.amount;
      continue;
    }

    const isDebtPayment =
      transaction.reference_type === "debt" ||
      transaction.category_budget_role === "debt_payment";
    const isGoalContribution =
      transaction.reference_type === "goal" ||
      transaction.category_budget_role === "goal_contribution";
    const isEssential =
      transaction.category_local_id !== null &&
      essentialCategoryIds.has(transaction.category_local_id);

    if (isDebtPayment) {
      actualDebtTotal += transaction.amount;
      continue;
    }

    if (isGoalContribution) {
      actualGoalTotal += transaction.amount;
      continue;
    }

    if (isEssential || transaction.category_budget_role === "essential") {
      actualEssentialTotal += transaction.amount;
      continue;
    }

    actualFlexibleTotal += transaction.amount;
  }

  const orphanGoalContributionTotal = goalContributions
    .filter((contribution) => !contribution.transaction_local_id)
    .reduce((sum, contribution) => sum + contribution.amount, 0);

  actualGoalTotal += orphanGoalContributionTotal;

  const plannedAllocationTotal =
    budget.planned_essential_total +
    budget.planned_debt_total +
    budget.planned_goal_total +
    budget.planned_flexible_total +
    budget.buffer_total;

  const remainingToAssign = Math.max(
    budget.planned_income_total - plannedAllocationTotal,
    0,
  );
  const remainingFlexible = Math.max(
    budget.planned_flexible_total - actualFlexibleTotal,
    0,
  );

  return {
    budget,
    month_key: budget.month_key,
    currency_code: budget.currency_code,
    planned_income_total: budget.planned_income_total,
    actual_income_total: actualIncomeTotal,
    planned_essential_total: budget.planned_essential_total,
    actual_essential_total: actualEssentialTotal,
    planned_debt_total: budget.planned_debt_total,
    actual_debt_total: actualDebtTotal,
    planned_goal_total: budget.planned_goal_total,
    actual_goal_total: actualGoalTotal,
    planned_flexible_total: budget.planned_flexible_total,
    actual_flexible_total: actualFlexibleTotal,
    buffer_total: budget.buffer_total,
    remaining_to_assign: remainingToAssign,
    remaining_flexible: remainingFlexible,
    deviation_status: calculateDeviationStatus(
      budget,
      actualEssentialTotal,
      actualDebtTotal,
      actualGoalTotal,
      actualFlexibleTotal,
    ),
  } satisfies GeneratedMonthlyBudgetSummary;
}

export async function getCurrentMonthlyBudgetSummary(
  ownerType: string,
  ownerLocalId: string,
) {
  const currentMonthKey = getMonthKey();
  const currentMonthSummary = await getMonthlyBudgetSummary(
    ownerType,
    ownerLocalId,
    currentMonthKey,
  );

  if (currentMonthSummary) {
    return currentMonthSummary;
  }

  const latestBudget = await budgetRepository.getLatestBudgetByOwner(
    ownerType,
    ownerLocalId,
  );

  if (!latestBudget) {
    return null;
  }

  return getMonthlyBudgetSummary(ownerType, ownerLocalId, latestBudget.month_key);
}

export async function getMonthlyBudgetOverview(
  ownerType: string,
  ownerLocalId: string,
  monthKey: string,
) {
  const [summary, preferences, debts, goals] = await Promise.all([
    getMonthlyBudgetSummary(ownerType, ownerLocalId, monthKey),
    budgetPreferencesRepository.getBudgetPreferences(ownerLocalId),
    debtRepository.listDebtsByOwner(ownerType, ownerLocalId),
    goalRepository.listGoalsByOwner(ownerType, ownerLocalId),
  ]);

  if (!summary) {
    return null;
  }

  return {
    summary,
    preferences,
    debts,
    goals,
    alerts: budgetAlertsService.buildBudgetAlerts({
      summary,
      preferences,
      debts,
      goals,
    }),
  };
}

export async function getCurrentMonthlyBudgetOverview(
  ownerType: string,
  ownerLocalId: string,
) {
  const currentMonthKey = getMonthKey();
  const currentOverview = await getMonthlyBudgetOverview(
    ownerType,
    ownerLocalId,
    currentMonthKey,
  );

  if (currentOverview) {
    return currentOverview;
  }

  const latestBudget = await budgetRepository.getLatestBudgetByOwner(
    ownerType,
    ownerLocalId,
  );

  if (!latestBudget) {
    return null;
  }

  return getMonthlyBudgetOverview(ownerType, ownerLocalId, latestBudget.month_key);
}

export const budgetSummaryService = {
  getCurrentMonthlyBudgetOverview,
  getCurrentMonthlyBudgetSummary,
  getMonthlyBudgetOverview,
  getMonthlyBudgetSummary,
};
