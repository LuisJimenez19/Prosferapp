import type { BudgetPreferences } from "@/src/features/personal-finance/types/budget";
import type {
  DebtDraft,
  ExpenseDraft,
  GoalDraft,
  IncomeDraft,
} from "@/src/features/personal-finance/services/budget-setup-form";
import {
  calculateGoalPlanningCapacity,
  getDebtTimeline,
  projectGoalFutureValue,
  resolveEffectiveGoalAnnualYieldRate,
  estimateGoalCompletionMonths,
} from "@/src/features/personal-finance/services/planning-insights";
import { toDateInputValue } from "@/src/lib/dates";
import { parseMoneyInput } from "@/src/lib/money";

function readDraftAmount(value: string) {
  try {
    return parseMoneyInput(value, {});
  } catch {
    return 0;
  }
}

function readDraftRate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const normalizedValue = trimmedValue.replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

function getLaterDate(currentValue: string | null, nextValue: string | null) {
  if (!nextValue) {
    return currentValue;
  }

  if (!currentValue) {
    return nextValue;
  }

  return currentValue >= nextValue ? currentValue : nextValue;
}

function getEarlierDate(currentValue: string | null, nextValue: string | null) {
  if (!nextValue) {
    return currentValue;
  }

  if (!currentValue) {
    return nextValue;
  }

  return currentValue <= nextValue ? currentValue : nextValue;
}

export type BudgetSetupOverview = {
  activeDebtCount: number;
  bufferTotal: number;
  deferredDebtCount: number;
  desiredGoalContributionTotal: number;
  extraSavingsCapacity: number;
  goalPlanningCapacity: number;
  goalShortfall: number;
  plannedDebtTotal: number;
  plannedEssentialTotal: number;
  plannedIncomeTotal: number;
  projectedDebtFreeDate: string | null;
  projectedGoalValueInTwelveMonths: number;
  trackedDebtProjectionCount: number;
  trackedGoalProjectionCount: number;
  upcomingGoalCompletionDate: string | null;
};

export function buildBudgetSetupOverview(input: {
  debtDrafts: DebtDraft[];
  expenseDrafts: ExpenseDraft[];
  goalDrafts: GoalDraft[];
  incomeDrafts: IncomeDraft[];
  monthKey: string;
  preferences: BudgetPreferences;
}) {
  const plannedIncomeTotal = input.incomeDrafts.reduce(
    (sum, draft) => sum + readDraftAmount(draft.amount),
    0,
  );
  const plannedEssentialTotal = input.expenseDrafts.reduce(
    (sum, draft) => sum + readDraftAmount(draft.amount),
    0,
  );
  const goalPlanningCapacity = calculateGoalPlanningCapacity({
    debtPlans: input.debtDrafts.map((draft) => ({
      due_day: draft.due_day ? Number(draft.due_day) : null,
      minimum_payment: draft.minimum_payment,
      start_date: draft.start_date,
      target_payment: draft.target_payment,
    })),
    essentialAmounts: input.expenseDrafts.map((draft) => draft.amount),
    incomeAmounts: input.incomeDrafts.map((draft) => draft.amount),
    monthKey: input.monthKey,
    preferences: input.preferences,
  });

  let plannedDebtTotal = 0;
  let activeDebtCount = 0;
  let deferredDebtCount = 0;
  let projectedDebtFreeDate: string | null = null;
  let trackedDebtProjectionCount = 0;

  for (const draft of input.debtDrafts) {
    const minimumPayment = readDraftAmount(draft.minimum_payment);
    const targetPayment = Math.max(
      minimumPayment,
      readDraftAmount(draft.target_payment),
    );
    const timeline = getDebtTimeline({
      currentBalance: readDraftAmount(draft.current_balance),
      dueDay: draft.due_day ? Number(draft.due_day) : null,
      installmentsPaid: draft.installments_paid ? Number(draft.installments_paid) : 0,
      monthKey: input.monthKey,
      monthlyPayment: targetPayment,
      startDate: draft.start_date,
      totalInstallments: draft.total_installments
        ? Number(draft.total_installments)
        : null,
    });

    if (timeline.isActiveThisMonth) {
      plannedDebtTotal += targetPayment;
      activeDebtCount += 1;
    } else if (draft.name.trim() || draft.current_balance.trim()) {
      deferredDebtCount += 1;
    }

    const completionDate =
      timeline.scheduledCompletionDate ?? timeline.projectedPayoffDate;

    if (completionDate) {
      trackedDebtProjectionCount += 1;
      projectedDebtFreeDate = getLaterDate(projectedDebtFreeDate, completionDate);
    }
  }

  const desiredGoalContributionTotal = input.goalDrafts.reduce(
    (sum, draft) => sum + readDraftAmount(draft.target_monthly_contribution),
    0,
  );
  const extraSavingsCapacity = Math.max(
    goalPlanningCapacity - desiredGoalContributionTotal,
    0,
  );
  const goalShortfall = Math.max(
    desiredGoalContributionTotal - goalPlanningCapacity,
    0,
  );
  const bufferTotal =
    input.preferences.buffer_mode === "percentage"
      ? plannedIncomeTotal * (input.preferences.buffer_value / 100)
      : input.preferences.buffer_value;

  let projectedGoalValueInTwelveMonths = 0;
  let trackedGoalProjectionCount = 0;
  let upcomingGoalCompletionDate: string | null = null;

  for (const draft of input.goalDrafts) {
    const targetAmount = readDraftAmount(draft.target_amount);
    const monthlyContribution = readDraftAmount(draft.target_monthly_contribution);
    const effectiveAnnualYieldRate = resolveEffectiveGoalAnnualYieldRate(
      draft.savings_type,
      readDraftRate(draft.annual_yield_rate),
    );

    if (targetAmount <= 0 && monthlyContribution <= 0 && draft.current_amount <= 0) {
      continue;
    }

    trackedGoalProjectionCount += 1;
    projectedGoalValueInTwelveMonths += projectGoalFutureValue({
      annualYieldRate: effectiveAnnualYieldRate,
      currentAmount: draft.current_amount,
      monthlyContribution,
      months: 12,
    });

    const completionMonths = estimateGoalCompletionMonths({
      annualYieldRate: effectiveAnnualYieldRate,
      currentAmount: draft.current_amount,
      monthlyContribution,
      targetAmount,
    });

    if (completionMonths !== null) {
      const completionDate = new Date();
      completionDate.setMonth(completionDate.getMonth() + completionMonths);
      upcomingGoalCompletionDate = getEarlierDate(
        upcomingGoalCompletionDate,
        toDateInputValue(completionDate),
      );
    }
  }

  return {
    activeDebtCount,
    bufferTotal,
    deferredDebtCount,
    desiredGoalContributionTotal,
    extraSavingsCapacity,
    goalPlanningCapacity,
    goalShortfall,
    plannedDebtTotal,
    plannedEssentialTotal,
    plannedIncomeTotal,
    projectedDebtFreeDate,
    projectedGoalValueInTwelveMonths:
      Math.round(projectedGoalValueInTwelveMonths * 100) / 100,
    trackedDebtProjectionCount,
    trackedGoalProjectionCount,
    upcomingGoalCompletionDate,
  } satisfies BudgetSetupOverview;
}

export const budgetSetupSummaryService = {
  buildBudgetSetupOverview,
};
