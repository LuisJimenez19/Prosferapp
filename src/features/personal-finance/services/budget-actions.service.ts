import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import {
  getMonthDateRange,
  getMonthKey,
  toDateInputValue,
} from "@/src/lib/dates";
import type { OwnerType } from "@/src/types/common";
import { budgetIncomeRepository } from "../repositories/budget-income.repository";
import { budgetRepository } from "../repositories/budget.repository";
import { categoryRepository } from "../repositories/category.repository";
import { debtRepository } from "../repositories/debt.repository";
import { goalRepository } from "../repositories/goal.repository";
import { transactionRepository } from "../repositories/transaction.repository";
import { walletRepository } from "../repositories/wallet.repository";
import { isDebtActiveForMonth } from "./planning-insights";
import type { BudgetPlannedAction, BudgetPlannedActionSummary } from "../types/budget-actions";

function clampDayToMonth(monthKey: string, preferredDay: number) {
  const { days_in_month } = getMonthDateRange(monthKey);
  return Math.min(Math.max(preferredDay, 1), days_in_month);
}

function buildDateWithinMonth(monthKey: string, preferredDay: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const day = clampDayToMonth(monthKey, preferredDay);

  return toDateInputValue(new Date(year, month - 1, day, 12, 0, 0, 0));
}

function getDefaultDate(monthKey: string, scheduledDate: string | null) {
  if (scheduledDate) {
    return scheduledDate;
  }

  if (getMonthKey() === monthKey) {
    return toDateInputValue();
  }

  const { start_date } = getMonthDateRange(monthKey);
  return start_date;
}

function buildReferenceKey(referenceType: string | null, referenceLocalId: string | null) {
  return referenceType && referenceLocalId
    ? `${referenceType}:${referenceLocalId}`
    : null;
}

function resolveActionStatus(input: {
  monthKey: string;
  recordedAt: string | null;
  scheduledDate: string | null;
}) {
  if (input.recordedAt) {
    return "recorded" as const;
  }

  if (!input.scheduledDate) {
    return "ready" as const;
  }

  const today = getDefaultDate(input.monthKey, null);
  return input.scheduledDate > today ? "scheduled" as const : "ready" as const;
}

function buildSummary(actions: BudgetPlannedAction[]): BudgetPlannedActionSummary {
  return actions.reduce<BudgetPlannedActionSummary>(
    (summary, action) => {
      if (action.status === "recorded") {
        summary.recorded_count += 1;
        return summary;
      }

      summary.pending_total_amount += action.amount;

      if (action.status === "scheduled") {
        summary.scheduled_count += 1;
        return summary;
      }

      summary.ready_count += 1;
      return summary;
    },
    {
      pending_total_amount: 0,
      ready_count: 0,
      recorded_count: 0,
      scheduled_count: 0,
    },
  );
}

export async function getBudgetActionCenter(input: {
  monthKey: string;
  owner_local_id: string;
  owner_type: OwnerType;
}) {
  const wallets = await walletRepository.listWalletsByOwner({
    owner_local_id: input.owner_local_id,
    owner_type: input.owner_type,
  });
  const currencyCode = wallets[0]?.currency_code ?? DEFAULT_CURRENCY_CODE;
  const budget = await budgetRepository.getBudgetByMonth(
    input.owner_type,
    input.owner_local_id,
    input.monthKey,
  );

  if (!budget) {
    return {
      budget: null,
      currencyCode,
      plannedActions: [] as BudgetPlannedAction[],
      summary: buildSummary([]),
      wallets,
    };
  }

  const monthRange = getMonthDateRange(input.monthKey);
  const [
    budgetIncomeItems,
    budgetAllocations,
    categories,
    debts,
    goals,
    transactions,
  ] = await Promise.all([
    budgetIncomeRepository.listBudgetIncomeItems(budget.local_id),
    budgetRepository.listBudgetCategoryAllocationDetails(budget.local_id),
    categoryRepository.listCategoriesByOwner(input.owner_type, input.owner_local_id),
    debtRepository.listDebtsByOwner(input.owner_type, input.owner_local_id),
    goalRepository.listGoalsByOwner(input.owner_type, input.owner_local_id),
    transactionRepository.listTransactionsByOwnerAndDateRange(
      input.owner_type,
      input.owner_local_id,
      monthRange.start_iso,
      monthRange.end_iso,
    ),
  ]);

  const recordedByReference = new Map(
    transactions
      .map((transaction) => {
        const key = buildReferenceKey(
          transaction.reference_type,
          transaction.reference_local_id,
        );

        if (!key) {
          return null;
        }

        return [key, transaction] as const;
      })
      .filter(
        (entry): entry is readonly [string, (typeof transactions)[number]] =>
          entry !== null,
      ),
  );
  const defaultWalletLocalId = wallets[0]?.local_id ?? null;
  const incomeCategory =
    categories.find((category) => category.category_kind === "income") ?? null;
  const debtCategoriesByDebtLocalId = new Map(
    categories
      .filter((category) => category.default_debt_local_id)
      .map((category) => [category.default_debt_local_id as string, category]),
  );
  const goalCategoriesByGoalLocalId = new Map(
    categories
      .filter((category) => category.default_goal_local_id)
      .map((category) => [category.default_goal_local_id as string, category]),
  );

  const plannedActions: BudgetPlannedAction[] = [];

  if (incomeCategory) {
    for (const incomeItem of budgetIncomeItems) {
      const scheduledDate =
        incomeItem.expected_day !== null
          ? buildDateWithinMonth(input.monthKey, incomeItem.expected_day)
          : null;
      const referenceKey = buildReferenceKey("budget_income", incomeItem.local_id);
      const recorded = referenceKey ? recordedByReference.get(referenceKey) ?? null : null;

      plannedActions.push({
        id: `income:${incomeItem.local_id}`,
        amount: incomeItem.expected_amount,
        category_local_id: incomeCategory.local_id,
        category_name: incomeCategory.name,
        default_date: getDefaultDate(input.monthKey, scheduledDate),
        default_note: `Ingreso planificado: ${incomeItem.name}`,
        default_wallet_local_id:
          incomeItem.destination_wallet_local_id ?? defaultWalletLocalId,
        description: `Se registrara en la billetera configurada para este ingreso.`,
        kind: "income",
        recorded_at: recorded?.occurred_at ?? null,
        recorded_transaction_local_id: recorded?.local_id ?? null,
        recorded_wallet_name: recorded?.wallet_name ?? null,
        reference_local_id: incomeItem.local_id,
        reference_type: "budget_income",
        scheduled_date: scheduledDate,
        status: resolveActionStatus({
          monthKey: input.monthKey,
          recordedAt: recorded?.occurred_at ?? null,
          scheduledDate,
        }),
        title: incomeItem.name,
      });
    }
  }

  for (const allocation of budgetAllocations) {
    if (allocation.allocated_amount <= 0 || allocation.budget_role !== "essential") {
      continue;
    }

    const scheduledDate =
      allocation.expected_day !== null
        ? buildDateWithinMonth(input.monthKey, allocation.expected_day)
        : null;
    const referenceKey = buildReferenceKey("budget_essential", allocation.local_id);
    const recorded = referenceKey ? recordedByReference.get(referenceKey) ?? null : null;

    plannedActions.push({
      id: `essential:${allocation.local_id}`,
      amount: allocation.allocated_amount,
      category_local_id: allocation.category_local_id,
      category_name: allocation.category_name,
      default_date: getDefaultDate(input.monthKey, scheduledDate),
      default_note: `Esencial planificado: ${allocation.category_name}`,
      default_wallet_local_id: defaultWalletLocalId,
      description: "Sirve para registrar este gasto esencial sin volver a cargarlo a mano.",
      kind: "essential",
      recorded_at: recorded?.occurred_at ?? null,
      recorded_transaction_local_id: recorded?.local_id ?? null,
      recorded_wallet_name: recorded?.wallet_name ?? null,
      reference_local_id: allocation.local_id,
      reference_type: "budget_essential",
      scheduled_date: scheduledDate,
      status: resolveActionStatus({
        monthKey: input.monthKey,
        recordedAt: recorded?.occurred_at ?? null,
        scheduledDate,
      }),
      title: allocation.category_name,
    });
  }

  for (const debt of debts) {
    if (
      debt.status !== "active" ||
      debt.current_balance <= 0 ||
      !isDebtActiveForMonth({
        dueDay: debt.due_day,
        monthKey: input.monthKey,
        startDate: debt.start_date,
      })
    ) {
      continue;
    }

    const linkedCategory = debtCategoriesByDebtLocalId.get(debt.local_id);

    if (!linkedCategory) {
      continue;
    }

    const amount = Math.max(debt.target_payment, debt.minimum_payment);
    const scheduledDate =
      debt.due_day !== null
        ? buildDateWithinMonth(input.monthKey, debt.due_day)
        : debt.start_date?.startsWith(input.monthKey)
          ? debt.start_date
          : null;
    const referenceKey = buildReferenceKey("debt", debt.local_id);
    const recorded = referenceKey ? recordedByReference.get(referenceKey) ?? null : null;

    plannedActions.push({
      id: `debt:${debt.local_id}`,
      amount,
      category_local_id: linkedCategory.local_id,
      category_name: linkedCategory.name,
      default_date: getDefaultDate(input.monthKey, scheduledDate),
      default_note: `Pago planificado de deuda: ${debt.name}`,
      default_wallet_local_id: defaultWalletLocalId,
      description: "Al confirmarlo descontamos la billetera y actualizamos el saldo pendiente de la deuda.",
      kind: "debt",
      recorded_at: recorded?.occurred_at ?? null,
      recorded_transaction_local_id: recorded?.local_id ?? null,
      recorded_wallet_name: recorded?.wallet_name ?? null,
      reference_local_id: debt.local_id,
      reference_type: "debt",
      scheduled_date: scheduledDate,
      status: resolveActionStatus({
        monthKey: input.monthKey,
        recordedAt: recorded?.occurred_at ?? null,
        scheduledDate,
      }),
      title: debt.name,
    });
  }

  for (const goal of goals) {
    if (
      goal.status !== "active" ||
      goal.target_monthly_contribution <= 0 ||
      goal.current_amount >= goal.target_amount
    ) {
      continue;
    }

    const linkedCategory = goalCategoriesByGoalLocalId.get(goal.local_id);

    if (!linkedCategory) {
      continue;
    }

    const referenceKey = buildReferenceKey("goal", goal.local_id);
    const recorded = referenceKey ? recordedByReference.get(referenceKey) ?? null : null;
    const scheduledDate =
      goal.target_date?.startsWith(input.monthKey)
        ? goal.target_date
        : null;

    plannedActions.push({
      id: `goal:${goal.local_id}`,
      amount: goal.target_monthly_contribution,
      category_local_id: linkedCategory.local_id,
      category_name: linkedCategory.name,
      default_date: getDefaultDate(input.monthKey, scheduledDate),
      default_note: `Aporte planificado a meta: ${goal.name}`,
      default_wallet_local_id: defaultWalletLocalId,
      description: "Al confirmarlo registramos el gasto y actualizamos lo acumulado en la meta.",
      kind: "goal",
      recorded_at: recorded?.occurred_at ?? null,
      recorded_transaction_local_id: recorded?.local_id ?? null,
      recorded_wallet_name: recorded?.wallet_name ?? null,
      reference_local_id: goal.local_id,
      reference_type: "goal",
      scheduled_date: scheduledDate,
      status: resolveActionStatus({
        monthKey: input.monthKey,
        recordedAt: recorded?.occurred_at ?? null,
        scheduledDate,
      }),
      title: goal.name,
    });
  }

  plannedActions.sort((left, right) => {
    if (left.status === "recorded" && right.status !== "recorded") {
      return 1;
    }

    if (left.status !== "recorded" && right.status === "recorded") {
      return -1;
    }

    return left.default_date.localeCompare(right.default_date);
  });

  return {
    budget,
    currencyCode,
    plannedActions,
    summary: buildSummary(plannedActions),
    wallets,
  };
}

export async function confirmBudgetPlannedAction(input: {
  amount: number;
  category_local_id: string;
  occurred_at: string;
  owner_local_id: string;
  owner_type: OwnerType;
  reference_local_id: string;
  reference_type: BudgetPlannedAction["reference_type"];
  wallet_local_id: string;
  note?: string;
}) {
  const transactionType =
    input.reference_type === "budget_income" ? "income" : "expense";

  return transactionRepository.createTransaction({
    amount: input.amount,
    category_local_id: input.category_local_id,
    note: input.note,
    occurred_at: input.occurred_at,
    owner_local_id: input.owner_local_id,
    owner_type: input.owner_type,
    reference_local_id: input.reference_local_id,
    reference_type: input.reference_type,
    transaction_type: transactionType,
    wallet_local_id: input.wallet_local_id,
  });
}
