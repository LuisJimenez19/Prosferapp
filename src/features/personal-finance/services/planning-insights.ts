import type { BudgetPreferences } from "@/src/features/personal-finance/types/budget";
import type { SavingsType } from "@/src/features/personal-finance/types/goal";
import {
  dateInputValueToDate,
  getMonthDateRange,
  toDateInputValue,
} from "@/src/lib/dates";
import { parseMoneyInput } from "@/src/lib/money";

function readDraftAmount(value: string) {
  try {
    return parseMoneyInput(value, {});
  } catch {
    return 0;
  }
}

function getMonthlyRate(annualRate: number) {
  return Math.max(annualRate, 0) / 12 / 100;
}

function resolveOptionalDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  try {
    return dateInputValueToDate(value);
  } catch {
    return null;
  }
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function setDateWithinMonth(date: Date, preferredDay: number) {
  const nextDate = new Date(date);
  nextDate.setDate(
    Math.min(
      Math.max(preferredDay, 1),
      getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth()),
    ),
  );
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
}

export function addMonthsToDate(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

export function calculateGoalPlanningCapacity(input: {
  monthKey: string;
  incomeAmounts: string[];
  essentialAmounts: string[];
  debtPlans: {
    minimum_payment: string;
    target_payment: string;
    start_date?: string | null;
    due_day?: number | null;
  }[];
  preferences: BudgetPreferences;
}) {
  const plannedIncomeTotal = input.incomeAmounts.reduce(
    (sum, value) => sum + readDraftAmount(value),
    0,
  );
  const plannedEssentialTotal = input.essentialAmounts.reduce(
    (sum, value) => sum + readDraftAmount(value),
    0,
  );
  const plannedDebtTotal = input.debtPlans.reduce((sum, debt) => {
    if (
      !isDebtActiveForMonth({
        dueDay: debt.due_day ?? null,
        monthKey: input.monthKey,
        startDate: debt.start_date ?? null,
      })
    ) {
      return sum;
    }

    const targetAmount = readDraftAmount(debt.target_payment);
    const minimumAmount = readDraftAmount(debt.minimum_payment);

    return sum + Math.max(targetAmount, minimumAmount);
  }, 0);
  const bufferTotal =
    input.preferences.buffer_mode === "percentage"
      ? plannedIncomeTotal * (input.preferences.buffer_value / 100)
      : input.preferences.buffer_value;

  return Math.max(
    Math.round(
      (plannedIncomeTotal - plannedEssentialTotal - plannedDebtTotal - bufferTotal) *
        100,
    ) / 100,
    0,
  );
}

export function estimateDebtPayoffMonths(input: {
  currentBalance: number;
  monthlyPayment: number;
  annualInterestRate?: number;
}) {
  if (input.currentBalance <= 0 || input.monthlyPayment <= 0) {
    return null;
  }

  const monthlyRate = getMonthlyRate(input.annualInterestRate ?? 0);
  let remainingBalance = input.currentBalance;

  for (let month = 1; month <= 600; month += 1) {
    remainingBalance += remainingBalance * monthlyRate;
    remainingBalance -= input.monthlyPayment;

    if (remainingBalance <= 0) {
      return month;
    }
  }

  return null;
}

export function resolveEffectiveGoalAnnualYieldRate(
  savingsType: SavingsType,
  annualYieldRate: number,
) {
  return savingsType === "cash" ? 0 : Math.max(annualYieldRate, 0);
}

export function resolveDebtFirstInstallmentDate(input: {
  dueDay?: number | null;
  startDate?: string | null;
}) {
  const parsedStartDate = resolveOptionalDate(input.startDate ?? null);

  if (!parsedStartDate) {
    return null;
  }

  if (!input.dueDay) {
    return parsedStartDate;
  }

  const firstInstallmentDate = new Date(parsedStartDate);
  firstInstallmentDate.setDate(1);
  firstInstallmentDate.setHours(12, 0, 0, 0);

  let alignedDate = setDateWithinMonth(firstInstallmentDate, input.dueDay);

  if (alignedDate.getTime() < parsedStartDate.getTime()) {
    alignedDate = setDateWithinMonth(
      new Date(
        parsedStartDate.getFullYear(),
        parsedStartDate.getMonth() + 1,
        1,
        12,
        0,
        0,
        0,
      ),
      input.dueDay,
    );
  }

  return alignedDate;
}

export function isDebtActiveForMonth(input: {
  dueDay?: number | null;
  monthKey: string;
  startDate?: string | null;
}) {
  const firstInstallmentDate = resolveDebtFirstInstallmentDate({
    dueDay: input.dueDay,
    startDate: input.startDate,
  });

  if (!firstInstallmentDate) {
    return true;
  }

  const { end_date } = getMonthDateRange(input.monthKey);

  return (
    firstInstallmentDate.getTime() <= dateInputValueToDate(end_date).getTime()
  );
}

export function getDebtTimeline(input: {
  annualInterestRate?: number;
  currentBalance: number;
  dueDay?: number | null;
  installmentsPaid?: number;
  monthKey: string;
  monthlyPayment: number;
  startDate?: string | null;
  totalInstallments?: number | null;
}) {
  const firstInstallmentDate = resolveDebtFirstInstallmentDate({
    dueDay: input.dueDay,
    startDate: input.startDate,
  });
  const normalizedInstallmentsPaid = Math.max(input.installmentsPaid ?? 0, 0);
  const remainingInstallments =
    input.totalInstallments !== null && input.totalInstallments !== undefined
      ? Math.max(input.totalInstallments - normalizedInstallmentsPaid, 0)
      : null;
  const scheduledCompletionDate =
    firstInstallmentDate &&
    input.totalInstallments !== null &&
    input.totalInstallments !== undefined &&
    input.totalInstallments > 0
      ? toDateInputValue(
          setDateWithinMonth(
            new Date(
              firstInstallmentDate.getFullYear(),
              firstInstallmentDate.getMonth() + input.totalInstallments - 1,
              1,
              12,
              0,
              0,
              0,
            ),
            input.dueDay ?? firstInstallmentDate.getDate(),
          ),
        )
      : null;
  const nextInstallmentDate =
    firstInstallmentDate &&
    remainingInstallments !== null &&
    remainingInstallments > 0
      ? toDateInputValue(
          setDateWithinMonth(
            new Date(
              firstInstallmentDate.getFullYear(),
              firstInstallmentDate.getMonth() + normalizedInstallmentsPaid,
              1,
              12,
              0,
              0,
              0,
            ),
            input.dueDay ?? firstInstallmentDate.getDate(),
          ),
        )
      : null;
  const payoffMonths = estimateDebtPayoffMonths({
    annualInterestRate: input.annualInterestRate,
    currentBalance: input.currentBalance,
    monthlyPayment: input.monthlyPayment,
  });
  const payoffAnchorDate =
    firstInstallmentDate && firstInstallmentDate.getTime() > Date.now()
      ? firstInstallmentDate
      : new Date();
  const projectedPayoffDate =
    payoffMonths !== null
      ? toDateInputValue(addMonthsToDate(payoffAnchorDate, payoffMonths))
      : null;

  return {
    firstInstallmentDate:
      firstInstallmentDate !== null ? toDateInputValue(firstInstallmentDate) : null,
    isActiveThisMonth: isDebtActiveForMonth({
      dueDay: input.dueDay,
      monthKey: input.monthKey,
      startDate: input.startDate,
    }),
    nextInstallmentDate,
    payoffMonths,
    projectedPayoffDate,
    remainingInstallments,
    scheduledCompletionDate,
  };
}

export function projectGoalFutureValue(input: {
  currentAmount?: number;
  monthlyContribution: number;
  annualYieldRate?: number;
  months: number;
}) {
  const monthlyRate = getMonthlyRate(input.annualYieldRate ?? 0);
  let total = Math.max(input.currentAmount ?? 0, 0);

  for (let month = 0; month < input.months; month += 1) {
    total += total * monthlyRate;
    total += Math.max(input.monthlyContribution, 0);
  }

  return Math.round(total * 100) / 100;
}

export function estimateGoalCompletionMonths(input: {
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution: number;
  annualYieldRate?: number;
}) {
  if (input.targetAmount <= 0) {
    return null;
  }

  if ((input.currentAmount ?? 0) >= input.targetAmount) {
    return 0;
  }

  if (input.monthlyContribution <= 0) {
    return null;
  }

  for (let month = 1; month <= 600; month += 1) {
    const projectedValue = projectGoalFutureValue({
      currentAmount: input.currentAmount,
      monthlyContribution: input.monthlyContribution,
      annualYieldRate: input.annualYieldRate,
      months: month,
    });

    if (projectedValue >= input.targetAmount) {
      return month;
    }
  }

  return null;
}
