import { getMonthDateRange, getMonthKey } from "@/src/lib/dates";
import { budgetPreferencesRepository } from "../repositories/budget-preferences.repository";
import { budgetRepository } from "../repositories/budget.repository";
import { categoryRepository } from "../repositories/category.repository";
import { debtRepository } from "../repositories/debt.repository";
import { goalRepository } from "../repositories/goal.repository";
import { transactionRepository } from "../repositories/transaction.repository";
import { budgetAlertsService } from "./budget-alerts.service";
import type {
  Budget,
  BudgetComparisonBlock,
  BudgetComparisonMode,
  BudgetComparisonState,
  EssentialBudgetBreakdownItem,
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

function calculateComparisonState(
  plannedAmount: number,
  actualAmount: number,
): BudgetComparisonState {
  if (actualAmount === plannedAmount) {
    return "aligned";
  }

  return actualAmount > plannedAmount ? "above" : "below";
}

function calculateProgressRatio(plannedAmount: number, actualAmount: number) {
  if (plannedAmount <= 0) {
    return actualAmount > 0 ? 1 : 0;
  }

  return actualAmount / plannedAmount;
}

function buildComparisonBlock(input: {
  actual_amount: number;
  comparison_mode: BudgetComparisonMode;
  key: BudgetComparisonBlock["key"];
  planned_amount: number;
}): BudgetComparisonBlock {
  return {
    key: input.key,
    comparison_mode: input.comparison_mode,
    state: calculateComparisonState(input.planned_amount, input.actual_amount),
    planned_amount: input.planned_amount,
    actual_amount: input.actual_amount,
    difference_amount: input.actual_amount - input.planned_amount,
    progress_ratio: calculateProgressRatio(
      input.planned_amount,
      input.actual_amount,
    ),
  };
}

function buildEssentialBreakdown(input: {
  actual_amounts_by_category: Map<string, number>;
  planned_categories: Map<
    string,
    { allocated_amount: number; category_name: string }
  >;
}): EssentialBudgetBreakdownItem[] {
  return Array.from(input.planned_categories.entries())
    .map(([categoryLocalId, detail]) => {
      const actualAmount =
        input.actual_amounts_by_category.get(categoryLocalId) ?? 0;

      return {
        category_local_id: categoryLocalId,
        category_name: detail.category_name,
        allocated_amount: detail.allocated_amount,
        actual_amount: actualAmount,
        difference_amount: actualAmount - detail.allocated_amount,
        progress_ratio: calculateProgressRatio(
          detail.allocated_amount,
          actualAmount,
        ),
        state: calculateComparisonState(detail.allocated_amount, actualAmount),
      } satisfies EssentialBudgetBreakdownItem;
    })
    .filter(
      (item) => item.allocated_amount > 0 || item.actual_amount > 0,
    )
    .sort((left, right) => {
      const statePriority = {
        above: 0,
        aligned: 1,
        below: 2,
      } satisfies Record<BudgetComparisonState, number>;

      const leftPriority = statePriority[left.state];
      const rightPriority = statePriority[right.state];

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      const deltaDifference =
        Math.abs(right.difference_amount) - Math.abs(left.difference_amount);

      if (deltaDifference !== 0) {
        return deltaDifference;
      }

      return left.category_name.localeCompare(right.category_name);
    });
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
  const [
    transactions,
    budgetCategoryAllocations,
    essentialCategories,
    goalContributions,
  ] =
    await Promise.all([
      transactionRepository.listTransactionsByOwnerAndDateRange(
        ownerType,
        ownerLocalId,
        range.start_iso,
        range.end_iso,
      ),
      budgetRepository.listBudgetCategoryAllocationDetails(budget.local_id),
      categoryRepository.listCategoriesByOwnerAndBudgetRole(
        ownerType,
        ownerLocalId,
        "essential",
      ),
      goalRepository.listGoalContributionsByMonth(
        ownerType,
        ownerLocalId,
        range.start_iso,
        range.end_iso,
      ),
    ]);

  const essentialBreakdownMap = new Map<
    string,
    { allocated_amount: number; category_name: string }
  >(
    essentialCategories.map((category) => [
      category.local_id,
      {
        allocated_amount: 0,
        category_name: category.name,
      },
    ]),
  );

  for (const allocation of budgetCategoryAllocations) {
    essentialBreakdownMap.set(allocation.category_local_id, {
      allocated_amount: allocation.allocated_amount,
      category_name: allocation.category_name,
    });
  }

  const essentialCategoryIds = new Set(essentialBreakdownMap.keys());
  const actualEssentialByCategory = new Map<string, number>();

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
      const categoryLocalId =
        transaction.category_local_id ?? "__essential_without_category__";

      actualEssentialByCategory.set(
        categoryLocalId,
        (actualEssentialByCategory.get(categoryLocalId) ?? 0) +
          transaction.amount,
      );

      if (!essentialBreakdownMap.has(categoryLocalId)) {
        essentialBreakdownMap.set(categoryLocalId, {
          allocated_amount: 0,
          category_name: transaction.category_name ?? "Esencial sin categoria",
        });
      }

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
  const comparisonBlocks = [
    buildComparisonBlock({
      actual_amount: actualIncomeTotal,
      comparison_mode: "target",
      key: "income",
      planned_amount: budget.planned_income_total,
    }),
    buildComparisonBlock({
      actual_amount: actualEssentialTotal,
      comparison_mode: "cap",
      key: "essentials",
      planned_amount: budget.planned_essential_total,
    }),
    buildComparisonBlock({
      actual_amount: actualDebtTotal,
      comparison_mode: "target",
      key: "debts",
      planned_amount: budget.planned_debt_total,
    }),
    buildComparisonBlock({
      actual_amount: actualGoalTotal,
      comparison_mode: "target",
      key: "goals",
      planned_amount: budget.planned_goal_total,
    }),
    buildComparisonBlock({
      actual_amount: actualFlexibleTotal,
      comparison_mode: "cap",
      key: "flexible",
      planned_amount: budget.planned_flexible_total,
    }),
  ];

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
    comparison_blocks: comparisonBlocks,
    deviation_status: calculateDeviationStatus(
      budget,
      actualEssentialTotal,
      actualDebtTotal,
      actualGoalTotal,
      actualFlexibleTotal,
    ),
    essential_breakdown: buildEssentialBreakdown({
      actual_amounts_by_category: actualEssentialByCategory,
      planned_categories: essentialBreakdownMap,
    }),
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
