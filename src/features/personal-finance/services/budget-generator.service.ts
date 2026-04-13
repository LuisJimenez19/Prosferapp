import { withTransaction } from "@/src/database/queries";
import { getMonthDateRange } from "@/src/lib/dates";
import type { OwnerType } from "@/src/types/common";
import type { DatabaseTransaction } from "@/src/types/database";
import { budgetIncomeRepository } from "../repositories/budget-income.repository";
import {
  budgetPreferencesRepository,
  DEFAULT_BUDGET_PREFERENCES,
} from "../repositories/budget-preferences.repository";
import { budgetRepository } from "../repositories/budget.repository";
import { categoryRepository } from "../repositories/category.repository";
import { debtRepository } from "../repositories/debt.repository";
import { goalRepository } from "../repositories/goal.repository";
import { budgetAlertsService } from "./budget-alerts.service";
import { budgetSummaryService } from "./budget-summary.service";
import { isDebtActiveForMonth } from "./planning-insights";
import type {
  BudgetPreferences,
  BudgetRole,
  BudgetSetupInput,
  EssentialExpensePlanningInput,
  MonthlyIncomePlanningInput,
} from "../types/budget";
import type { Debt } from "../types/debt";
import type { SavingsGoal } from "../types/goal";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizePreferences(preferences: BudgetPreferences) {
  return {
    ...DEFAULT_BUDGET_PREFERENCES,
    ...preferences,
    buffer_value: Math.max(preferences.buffer_value, 0),
    alert_threshold_percentage: Math.max(preferences.alert_threshold_percentage, 0),
    overspend_threshold_amount: Math.max(
      preferences.overspend_threshold_amount,
      0,
    ),
  } satisfies BudgetPreferences;
}

function normalizeIncomeItems(items: MonthlyIncomePlanningInput[]) {
  return items
    .filter((item) => item.name.trim() && item.expected_amount > 0)
    .map((item, index) => ({
      ...item,
      name: item.name.trim(),
      expected_amount: roundMoney(item.expected_amount),
      expected_day: item.expected_day ?? null,
      is_primary: item.is_primary ?? index === 0,
      reliability_level: item.reliability_level ?? "fixed",
    }));
}

function normalizeEssentialExpenses(items: EssentialExpensePlanningInput[]) {
  return items
    .filter((item) => item.allocated_amount > 0)
    .map((item, index) => ({
      ...item,
      allocated_amount: roundMoney(item.allocated_amount),
      priority_order: item.priority_order ?? index,
      is_fixed: item.is_fixed ?? true,
      expected_day: item.expected_day ?? null,
    }));
}

function buildLinkedCategoryName(prefix: "Deuda" | "Meta", name: string) {
  return `${prefix} · ${name.trim()}`;
}

async function ensureLinkedDebtCategory(
  ownerType: OwnerType,
  ownerLocalId: string,
  debt: Debt,
  db?: DatabaseTransaction,
) {
  const categories = await categoryRepository.listCategoriesByOwnerAndKind(
    ownerType,
    ownerLocalId,
    "expense",
    db,
  );
  const existingCategory =
    categories.find((category) => category.default_debt_local_id === debt.local_id) ??
    categories.find(
      (category) =>
        category.name.trim().toLowerCase() ===
        buildLinkedCategoryName("Deuda", debt.name).toLowerCase(),
    ) ??
    null;

  if (existingCategory) {
    return categoryRepository.updateCategory(existingCategory.local_id, {
      name: buildLinkedCategoryName("Deuda", debt.name),
      budget_role: "debt_payment",
      is_essential: false,
      default_debt_local_id: debt.local_id,
      default_goal_local_id: null,
    }, db);
  }

  return categoryRepository.createCategory({
    owner_type: ownerType,
    owner_local_id: ownerLocalId,
    name: buildLinkedCategoryName("Deuda", debt.name),
    category_kind: "expense",
    budget_role: "debt_payment",
    is_essential: false,
    default_debt_local_id: debt.local_id,
    default_goal_local_id: null,
  }, db);
}

async function ensureLinkedGoalCategory(
  ownerType: OwnerType,
  ownerLocalId: string,
  goal: SavingsGoal,
  db?: DatabaseTransaction,
) {
  const categories = await categoryRepository.listCategoriesByOwnerAndKind(
    ownerType,
    ownerLocalId,
    "expense",
    db,
  );
  const existingCategory =
    categories.find((category) => category.default_goal_local_id === goal.local_id) ??
    categories.find(
      (category) =>
        category.name.trim().toLowerCase() ===
        buildLinkedCategoryName("Meta", goal.name).toLowerCase(),
    ) ??
    null;

  if (existingCategory) {
    return categoryRepository.updateCategory(existingCategory.local_id, {
      name: buildLinkedCategoryName("Meta", goal.name),
      budget_role: "goal_contribution",
      is_essential: false,
      default_goal_local_id: goal.local_id,
      default_debt_local_id: null,
    }, db);
  }

  return categoryRepository.createCategory({
    owner_type: ownerType,
    owner_local_id: ownerLocalId,
    name: buildLinkedCategoryName("Meta", goal.name),
    category_kind: "expense",
    budget_role: "goal_contribution",
    is_essential: false,
    default_goal_local_id: goal.local_id,
    default_debt_local_id: null,
  }, db);
}

async function clearLinkedBudgetCategories(
  ownerType: OwnerType,
  ownerLocalId: string,
  removedDebtIds: string[],
  removedGoalIds: string[],
  db?: DatabaseTransaction,
) {
  if (removedDebtIds.length === 0 && removedGoalIds.length === 0) {
    return;
  }

  const expenseCategories = await categoryRepository.listCategoriesByOwnerAndKind(
    ownerType,
    ownerLocalId,
    "expense",
    db,
  );

  await Promise.all(
    expenseCategories.map(async (category) => {
      const shouldClearDebtLink =
        category.default_debt_local_id !== null &&
        removedDebtIds.includes(category.default_debt_local_id);
      const shouldClearGoalLink =
        category.default_goal_local_id !== null &&
        removedGoalIds.includes(category.default_goal_local_id);

      if (!shouldClearDebtLink && !shouldClearGoalLink) {
        return;
      }

      await categoryRepository.updateCategory(category.local_id, {
        budget_role: category.is_essential ? "essential" : "flexible",
        default_debt_local_id: shouldClearDebtLink
          ? null
          : category.default_debt_local_id,
        default_goal_local_id: shouldClearGoalLink
          ? null
          : category.default_goal_local_id,
      }, db);
    }),
  );
}

async function syncCategoryBudgetMetadata(
  ownerType: OwnerType,
  ownerLocalId: string,
  essentialExpenses: EssentialExpensePlanningInput[],
  db?: DatabaseTransaction,
) {
  const categories = await categoryRepository.listCategoriesByOwner(
    ownerType,
    ownerLocalId,
    db,
  );
  const essentialCategoryIds = new Set(
    essentialExpenses.map((expense) => expense.category_local_id),
  );

  await Promise.all(
    categories.map(async (category) => {
      let nextBudgetRole: BudgetRole = category.budget_role;
      let nextIsEssential = category.is_essential;

      if (category.category_kind === "income") {
        nextBudgetRole = "income";
        nextIsEssential = false;
      } else if (category.default_debt_local_id) {
        nextBudgetRole = "debt_payment";
        nextIsEssential = false;
      } else if (category.default_goal_local_id) {
        nextBudgetRole = "goal_contribution";
        nextIsEssential = false;
      } else if (
        category.is_essential ||
        essentialCategoryIds.has(category.local_id)
      ) {
        nextBudgetRole = "essential";
        nextIsEssential = true;
      } else if (category.budget_role !== "ignore") {
        nextBudgetRole = "flexible";
        nextIsEssential = false;
      }

      if (
        nextBudgetRole === category.budget_role &&
        nextIsEssential === category.is_essential
      ) {
        return;
      }

      await categoryRepository.updateCategory(category.local_id, {
        budget_role: nextBudgetRole,
        is_essential: nextIsEssential,
      }, db);
    }),
  );
}

export async function generateMonthlyBudgetPlan(input: BudgetSetupInput) {
  const normalizedPreferences = normalizePreferences(input.preferences);
  const normalizedIncomes = normalizeIncomeItems(input.monthly_incomes);
  const normalizedEssentialExpenses = normalizeEssentialExpenses(
    input.essential_expenses,
  );

  if (normalizedIncomes.length === 0) {
    throw new Error("At least one monthly income item is required.");
  }

  const { budget, persistedDebts, persistedGoals } = await withTransaction(
    async (db) => {
      const [existingDebts, existingGoals] = await Promise.all([
        debtRepository.listDebtsByOwner(
          input.owner_type,
          input.owner_local_id,
          db,
        ),
        goalRepository.listGoalsByOwner(
          input.owner_type,
          input.owner_local_id,
          db,
        ),
      ]);

      const persistedDebts = (
        await Promise.all(
          input.debts
            .filter((debt) => debt.name.trim())
            .map((debt, index) =>
              debtRepository.upsertDebt(
                input.owner_type,
                input.owner_local_id,
                {
                  ...debt,
                  priority_rank: debt.priority_rank ?? index,
                },
                db,
              ),
            ),
        )
      ).filter((debt): debt is Debt => debt !== null);

      const persistedGoals = (
        await Promise.all(
          input.savings_goals
            .filter((goal) => goal.name.trim() && goal.target_amount > 0)
            .map((goal, index) =>
              goalRepository.upsertGoal(
                input.owner_type,
                input.owner_local_id,
                {
                  ...goal,
                  priority_rank: goal.priority_rank ?? index,
                  target_monthly_contribution: roundMoney(
                    goal.target_monthly_contribution,
                  ),
                },
                db,
              ),
            ),
        )
      ).filter((goal): goal is SavingsGoal => goal !== null);

      const removedDebtIds = existingDebts
        .filter(
          (debt) =>
            !persistedDebts.some(
              (persistedDebt) => persistedDebt.local_id === debt.local_id,
            ),
        )
        .map((debt) => debt.local_id);
      const removedGoalIds = existingGoals
        .filter(
          (goal) =>
            !persistedGoals.some(
              (persistedGoal) => persistedGoal.local_id === goal.local_id,
            ),
        )
        .map((goal) => goal.local_id);

      await Promise.all([
        ...removedDebtIds.map((debtLocalId) =>
          debtRepository.softDeleteDebt(debtLocalId, db),
        ),
        ...removedGoalIds.map((goalLocalId) =>
          goalRepository.softDeleteGoal(goalLocalId, db),
        ),
      ]);

      await Promise.all([
        budgetPreferencesRepository.saveBudgetPreferences(
          input.owner_local_id,
          normalizedPreferences,
          db,
        ),
        ...persistedDebts.map((debt) =>
          ensureLinkedDebtCategory(
            input.owner_type,
            input.owner_local_id,
            debt,
            db,
          ),
        ),
        ...persistedGoals.map((goal) =>
          ensureLinkedGoalCategory(
            input.owner_type,
            input.owner_local_id,
            goal,
            db,
          ),
        ),
      ]);

      await clearLinkedBudgetCategories(
        input.owner_type,
        input.owner_local_id,
        removedDebtIds,
        removedGoalIds,
        db,
      );

      await syncCategoryBudgetMetadata(
        input.owner_type,
        input.owner_local_id,
        normalizedEssentialExpenses,
        db,
      );

      const plannedIncomeTotal = roundMoney(
        normalizedIncomes.reduce((sum, income) => sum + income.expected_amount, 0),
      );
      const plannedEssentialTotal = roundMoney(
        normalizedEssentialExpenses.reduce(
          (sum, expense) => sum + expense.allocated_amount,
          0,
        ),
      );
      const plannedDebtTotal = roundMoney(
        persistedDebts.reduce(
          (sum, debt) =>
            isDebtActiveForMonth({
              dueDay: debt.due_day,
              monthKey: input.month_key,
              startDate: debt.start_date,
            })
              ? sum + Math.max(debt.minimum_payment, debt.target_payment)
              : sum,
          0,
        ),
      );
      const desiredGoalTotal = roundMoney(
        persistedGoals.reduce(
          (sum, goal) => sum + goal.target_monthly_contribution,
          0,
        ),
      );
      const initialBufferTotal =
        normalizedPreferences.buffer_mode === "percentage"
          ? roundMoney(
              plannedIncomeTotal * (normalizedPreferences.buffer_value / 100),
            )
          : roundMoney(normalizedPreferences.buffer_value);
      const availableAfterFixed = roundMoney(
        plannedIncomeTotal -
          initialBufferTotal -
          plannedEssentialTotal -
          plannedDebtTotal,
      );
      const plannedGoalTotal = roundMoney(
        availableAfterFixed > 0
          ? Math.min(desiredGoalTotal, availableAfterFixed)
          : 0,
      );
      const remainingAfterGoals = roundMoney(
        Math.max(availableAfterFixed - plannedGoalTotal, 0),
      );
      const plannedFlexibleTotal = normalizedPreferences.allow_flexible_spending
        ? remainingAfterGoals
        : 0;
      const bufferTotal = normalizedPreferences.allow_flexible_spending
        ? initialBufferTotal
        : roundMoney(initialBufferTotal + remainingAfterGoals);
      const amountLimit = roundMoney(
        plannedEssentialTotal +
          plannedDebtTotal +
          plannedGoalTotal +
          plannedFlexibleTotal +
          bufferTotal,
      );

      const monthRange = getMonthDateRange(input.month_key);
      const budget = await budgetRepository.upsertMonthlyBudget(
        {
          owner_type: input.owner_type,
          owner_local_id: input.owner_local_id,
          month_key: input.month_key,
          currency_code: input.currency_code,
          preferences: normalizedPreferences,
          name: `Plan ${input.month_key}`,
          start_date: monthRange.start_date,
          end_date: monthRange.end_date,
          amount_limit: amountLimit,
          planned_income_total: plannedIncomeTotal,
          planned_essential_total: plannedEssentialTotal,
          planned_debt_total: plannedDebtTotal,
          planned_goal_total: plannedGoalTotal,
          planned_flexible_total: plannedFlexibleTotal,
          buffer_total: bufferTotal,
          status: "active",
        },
        db,
      );

      await Promise.all([
        budgetIncomeRepository.replaceBudgetIncomeItems(
          budget.local_id,
          normalizedIncomes,
          db,
        ),
        budgetRepository.replaceBudgetCategoryAllocations(
          budget.local_id,
          normalizedEssentialExpenses,
          db,
        ),
      ]);

      return {
        budget,
        persistedDebts,
        persistedGoals,
      };
    },
  );

  const summary = await budgetSummaryService.getMonthlyBudgetSummary(
    input.owner_type,
    input.owner_local_id,
    input.month_key,
  );

  if (!summary) {
    throw new Error("Budget summary was not available after generation.");
  }

  const alerts = budgetAlertsService.buildBudgetAlerts({
    summary,
    preferences: normalizedPreferences,
    debts: persistedDebts,
    goals: persistedGoals,
  });

  return {
    budget,
    summary,
    alerts,
    debts: persistedDebts,
    goals: persistedGoals,
    preferences: normalizedPreferences,
  };
}

export const budgetGeneratorService = {
  generateMonthlyBudgetPlan,
};
