import type { OwnedEntity } from "@/src/types/common";
import type {
  BudgetCategoryAllocation,
  BudgetPreferences,
  BudgetSetupInput,
  IncomeReliabilityLevel,
  MonthlyIncomePlanItem,
} from "@/src/features/personal-finance/types/budget";
import type { Category } from "@/src/features/personal-finance/types/category";
import type { Debt } from "@/src/features/personal-finance/types/debt";
import type { SavingsGoal, SavingsType } from "@/src/features/personal-finance/types/goal";
import { dateInputValueToDate } from "@/src/lib/dates";
import { generateLocalId } from "@/src/lib/ids";
import { parseMoneyInput } from "@/src/lib/money";

export type IncomeDraft = {
  client_id: string;
  local_id?: string;
  name: string;
  amount: string;
  expected_day: string;
  destination_wallet_local_id: string | null;
  is_primary: boolean;
  reliability_level: IncomeReliabilityLevel;
};

export type ExpenseDraft = {
  category_local_id: string;
  allocation_local_id?: string;
  category_name: string;
  amount: string;
  expected_day: string;
  is_fixed: boolean;
  is_system: boolean;
};

export type DebtDraft = {
  client_id: string;
  local_id?: string;
  name: string;
  start_date: string;
  current_balance: string;
  minimum_payment: string;
  target_payment: string;
  due_day: string;
  total_installments: string;
  installments_paid: string;
  payoff_target_date: string;
};

export type GoalDraft = {
  client_id: string;
  local_id?: string;
  name: string;
  description: string;
  target_amount: string;
  current_amount: number;
  target_monthly_contribution: string;
  target_date: string;
  savings_type: SavingsType;
  annual_yield_rate: string;
};

type BudgetSetupDraftSeed = {
  budgetAllocations: BudgetCategoryAllocation[];
  budgetIncomeItems: MonthlyIncomePlanItem[];
  categories: Category[];
  debts: Debt[];
  goals: SavingsGoal[];
};

type BuildBudgetSetupInputParams = OwnedEntity & {
  month_key: string;
  currency_code: string;
  debt_drafts: DebtDraft[];
  expense_drafts: ExpenseDraft[];
  goal_drafts: GoalDraft[];
  income_drafts: IncomeDraft[];
  preferences: BudgetPreferences;
};

export function createEmptyIncomeDraft(
  defaultWalletLocalId: string | null = null,
): IncomeDraft {
  return {
    client_id: generateLocalId("income_draft"),
    name: "",
    amount: "",
    expected_day: "",
    destination_wallet_local_id: defaultWalletLocalId,
    is_primary: false,
    reliability_level: "fixed",
  };
}

export function createInitialIncomeDraft(
  defaultWalletLocalId: string | null = null,
): IncomeDraft {
  return {
    ...createEmptyIncomeDraft(defaultWalletLocalId),
    name: "Ingreso principal",
    is_primary: true,
  };
}

export function createEmptyDebtDraft(): DebtDraft {
  return {
    client_id: generateLocalId("debt_draft"),
    name: "",
    start_date: "",
    current_balance: "",
    minimum_payment: "",
    target_payment: "",
    due_day: "",
    total_installments: "",
    installments_paid: "",
    payoff_target_date: "",
  };
}

export function createEmptyGoalDraft(): GoalDraft {
  return {
    client_id: generateLocalId("goal_draft"),
    name: "",
    description: "",
    target_amount: "",
    current_amount: 0,
    target_monthly_contribution: "",
    target_date: "",
    savings_type: "cash",
    annual_yield_rate: "",
  };
}

export function createBudgetSetupDrafts({
  budgetAllocations,
  budgetIncomeItems,
  categories,
  debts,
  goals,
}: BudgetSetupDraftSeed) {
  const expenseCategories = categories.filter(
    (category) =>
      category.category_kind === "expense" &&
      !category.default_debt_local_id &&
      !category.default_goal_local_id,
  );
  const expenseCategoryMap = new Map(
    expenseCategories.map((category) => [category.local_id, category]),
  );
  const orderedAllocations = [...budgetAllocations].sort(
    (left, right) => left.priority_order - right.priority_order,
  );
  const seenExpenseCategoryIds = new Set<string>();
  const expenseDrafts: ExpenseDraft[] = [];

  for (const allocation of orderedAllocations) {
    const category = expenseCategoryMap.get(allocation.category_local_id);

    if (!category) {
      continue;
    }

    seenExpenseCategoryIds.add(category.local_id);
    expenseDrafts.push({
      category_local_id: category.local_id,
      allocation_local_id: allocation.local_id,
      category_name: category.name,
      amount: String(allocation.allocated_amount),
      expected_day: allocation.expected_day ? String(allocation.expected_day) : "",
      is_fixed: allocation.is_fixed,
      is_system: category.is_system,
    });
  }

  for (const category of expenseCategories) {
    if (!category.is_essential || seenExpenseCategoryIds.has(category.local_id)) {
      continue;
    }

    expenseDrafts.push({
      category_local_id: category.local_id,
      category_name: category.name,
      amount: "0",
      expected_day: "",
      is_fixed: true,
      is_system: category.is_system,
    });
  }

  const incomeDrafts: IncomeDraft[] =
    budgetIncomeItems.length > 0
      ? budgetIncomeItems.map((item) => ({
          client_id: item.local_id,
          local_id: item.local_id,
          name: item.name,
          amount: String(item.expected_amount),
          expected_day: item.expected_day ? String(item.expected_day) : "",
          destination_wallet_local_id: item.destination_wallet_local_id ?? null,
          is_primary: item.is_primary,
          reliability_level: item.reliability_level,
        }))
      : [createInitialIncomeDraft()];

  const debtDrafts: DebtDraft[] = debts.map((debt) => ({
    client_id: debt.local_id,
    local_id: debt.local_id,
    name: debt.name,
    start_date: debt.start_date ?? "",
    current_balance: String(debt.current_balance),
    minimum_payment: String(debt.minimum_payment),
    target_payment: String(debt.target_payment),
    due_day: debt.due_day ? String(debt.due_day) : "",
    total_installments: debt.total_installments
      ? String(debt.total_installments)
      : "",
    installments_paid: String(debt.installments_paid),
    payoff_target_date: debt.payoff_target_date ?? "",
  }));

  const goalDrafts: GoalDraft[] = goals.map((goal) => ({
    client_id: goal.local_id,
    local_id: goal.local_id,
    name: goal.name,
    description: goal.description ?? "",
    target_amount: String(goal.target_amount),
    current_amount: goal.current_amount,
    target_monthly_contribution: String(goal.target_monthly_contribution),
    target_date: goal.target_date ?? "",
    savings_type: goal.savings_type,
    annual_yield_rate:
      goal.annual_yield_rate > 0 ? String(goal.annual_yield_rate) : "",
  }));

  return {
    debtDrafts,
    expenseDrafts,
    goalDrafts,
    incomeDrafts,
  };
}

export function getPickerDateForDay(monthKey: string, dayValue: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const parsedDay = Number(dayValue);
  const day =
    Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31
      ? parsedDay
      : 1;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function formatDayLabel(dayValue: string) {
  return dayValue.trim() ? `Dia ${dayValue.trim()}` : "";
}

export function dateToDayValue(date: Date) {
  return String(date.getDate());
}

function parseOptionalMoneyInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = trimmedValue.replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error("Usa un monto valido con hasta 2 decimales.");
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("El monto no puede ser negativo.");
  }

  return parsedValue;
}

function parseOptionalDayInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 31) {
    throw new Error("El dia debe estar entre 1 y 31.");
  }

  return parsedValue;
}

function parseOptionalIntegerInput(value: string, allowZero = false) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  const minimumValue = allowZero ? 0 : 1;

  if (!Number.isInteger(parsedValue) || parsedValue < minimumValue) {
    throw new Error(
      allowZero
        ? "Ingresa un numero entero mayor o igual a cero."
        : "Ingresa un numero entero mayor o igual a uno.",
    );
  }

  return parsedValue;
}

function parseOptionalRateInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const normalizedValue = trimmedValue.replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error("Usa una tasa valida con hasta 2 decimales.");
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("La tasa no puede ser negativa.");
  }

  return parsedValue;
}

function parseOptionalDateInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  dateInputValueToDate(trimmedValue);

  return trimmedValue;
}

export function buildBudgetSetupInput({
  owner_type,
  owner_local_id,
  month_key,
  currency_code,
  debt_drafts,
  expense_drafts,
  goal_drafts,
  income_drafts,
  preferences,
}: BuildBudgetSetupInputParams): BudgetSetupInput {
  const monthly_incomes = income_drafts
    .filter((draft) => draft.name.trim() || draft.amount.trim())
    .map((draft, index) => {
      if (!draft.name.trim()) {
        throw new Error("Cada ingreso debe tener nombre.");
      }

      return {
        local_id: draft.local_id,
        name: draft.name.trim(),
        expected_amount: parseMoneyInput(draft.amount, {
          invalidFormat: "Usa un monto valido para el ingreso.",
          nonPositive: "El ingreso debe ser mayor que cero.",
          required: "El ingreso necesita un monto.",
        }),
        expected_day: parseOptionalDayInput(draft.expected_day),
        destination_wallet_local_id: draft.destination_wallet_local_id,
        is_primary: draft.is_primary || index === 0,
        reliability_level: draft.reliability_level,
      };
    });

  const essential_expenses = expense_drafts
    .map((draft, index) => ({
      category_local_id: draft.category_local_id,
      allocated_amount: parseOptionalMoneyInput(draft.amount),
      priority_order: index,
      is_fixed: draft.is_fixed,
      expected_day: parseOptionalDayInput(draft.expected_day),
    }))
    .filter(
      (
        draft,
      ): draft is {
        allocated_amount: number;
        category_local_id: string;
        expected_day: number | null;
        is_fixed: boolean;
        priority_order: number;
      } => draft.allocated_amount !== null && draft.allocated_amount > 0,
    );

  const debts = debt_drafts
    .filter(
      (draft) =>
        draft.name.trim() ||
        draft.current_balance.trim() ||
        draft.minimum_payment.trim() ||
        draft.target_payment.trim(),
    )
    .map((draft, index) => {
      if (!draft.name.trim()) {
        throw new Error("Cada deuda necesita un nombre.");
      }

      const totalInstallments = parseOptionalIntegerInput(
        draft.total_installments,
      );
      const installmentsPaid =
        parseOptionalIntegerInput(draft.installments_paid, true) ?? 0;
      const currentBalance = parseOptionalMoneyInput(draft.current_balance);
      const minimumPayment = parseOptionalMoneyInput(draft.minimum_payment);
      const targetPayment = parseOptionalMoneyInput(draft.target_payment);

      if (totalInstallments !== null && installmentsPaid > totalInstallments) {
        throw new Error("Las cuotas pagadas no pueden superar las cuotas totales.");
      }

      if (totalInstallments === null && installmentsPaid > 0) {
        throw new Error("Para registrar cuotas pagadas primero define las cuotas totales.");
      }

        return {
          local_id: draft.local_id,
          name: draft.name.trim(),
          start_date: parseOptionalDateInput(draft.start_date),
          current_balance: currentBalance ?? 0,
          minimum_payment: minimumPayment ?? 0,
          target_payment: targetPayment ?? 0,
          due_day: parseOptionalDayInput(draft.due_day),
          total_installments: totalInstallments,
          installments_paid: installmentsPaid,
        payoff_target_date: parseOptionalDateInput(draft.payoff_target_date),
        priority_rank: index,
      };
    });

  const savings_goals = goal_drafts
    .filter(
      (draft) =>
        draft.name.trim() ||
        draft.target_amount.trim() ||
        draft.target_monthly_contribution.trim(),
    )
    .map((draft, index) => {
      if (!draft.name.trim()) {
        throw new Error("Cada meta necesita un nombre.");
      }

      return {
        local_id: draft.local_id,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        target_amount: parseMoneyInput(draft.target_amount, {
          invalidFormat: "Usa un monto objetivo valido.",
          nonPositive: "La meta debe ser mayor que cero.",
          required: "La meta necesita un monto objetivo.",
        }),
        current_amount: draft.current_amount,
        target_monthly_contribution: parseMoneyInput(
          draft.target_monthly_contribution,
          {
            invalidFormat: "Usa un aporte mensual valido.",
            nonPositive: "El aporte mensual debe ser mayor que cero.",
            required: "La meta necesita un aporte mensual.",
          },
        ),
        currency_code,
        target_date: parseOptionalDateInput(draft.target_date),
        priority_rank: index,
        savings_type: draft.savings_type,
        annual_yield_rate: parseOptionalRateInput(draft.annual_yield_rate),
      };
    });

  return {
    owner_type,
    owner_local_id,
    month_key,
    currency_code,
    monthly_incomes,
    essential_expenses,
    debts,
    savings_goals,
    preferences,
  };
}
