import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { budgetIncomeRepository } from "@/src/features/personal-finance/repositories/budget-income.repository";
import {
  budgetPreferencesRepository,
  DEFAULT_BUDGET_PREFERENCES,
} from "@/src/features/personal-finance/repositories/budget-preferences.repository";
import { budgetRepository } from "@/src/features/personal-finance/repositories/budget.repository";
import { categoryRepository } from "@/src/features/personal-finance/repositories/category.repository";
import { debtRepository } from "@/src/features/personal-finance/repositories/debt.repository";
import { goalRepository } from "@/src/features/personal-finance/repositories/goal.repository";
import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import { walletRepository } from "@/src/features/personal-finance/repositories/wallet.repository";
import { budgetGeneratorService } from "@/src/features/personal-finance/services/budget-generator.service";
import {
  buildBudgetSetupInput,
  createBudgetSetupDrafts,
  createEmptyDebtDraft,
  createEmptyGoalDraft,
  createEmptyIncomeDraft,
  createInitialIncomeDraft,
  type DebtDraft,
  type ExpenseDraft,
  type GoalDraft,
  type IncomeDraft,
} from "@/src/features/personal-finance/services/budget-setup-form";
import type { BudgetSetupPersistScope } from "@/src/features/personal-finance/types/budget-setup";
import type {
  BudgetBufferMode,
  BudgetPreferences,
  BudgetStrategyType,
} from "@/src/features/personal-finance/types/budget";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import { getMonthKey } from "@/src/lib/dates";

type PersonalOwnerContext = Awaited<ReturnType<typeof getPersonalContext>>;
type PersistedBudgetSetupState = {
  debtDrafts: DebtDraft[];
  expenseDrafts: ExpenseDraft[];
  goalDrafts: GoalDraft[];
  incomeDrafts: IncomeDraft[];
  preferences: BudgetPreferences;
};

export type BudgetSetupActions = {
  addDebtDraft: () => void;
  createEssentialCategory: (name: string) => Promise<void>;
  addGoalDraft: () => void;
  addIncomeDraft: () => void;
  removeEssentialCategory: (categoryLocalId: string) => Promise<void>;
  renameEssentialCategory: (
    categoryLocalId: string,
    nextName: string,
  ) => Promise<void>;
  removeDebtDraft: (clientId: string) => void;
  removeGoalDraft: (clientId: string) => void;
  removeIncomeDraft: (clientId: string) => void;
  setAllowFlexibleSpending: (value: boolean) => void;
  setBufferMode: (value: BudgetBufferMode) => void;
  setBufferValue: (value: string) => void;
  setPrimaryIncome: (clientId: string) => void;
  setPrioritizeDebtOverGoals: (value: boolean) => void;
  setStrategyType: (value: BudgetStrategyType) => void;
  updateDebtDraft: (clientId: string, updates: Partial<DebtDraft>) => void;
  updateExpenseDraft: (
    categoryLocalId: string,
    updates: Partial<ExpenseDraft>,
  ) => void;
  updateGoalDraft: (clientId: string, updates: Partial<GoalDraft>) => void;
  updateIncomeDraft: (clientId: string, updates: Partial<IncomeDraft>) => void;
};

export function useBudgetSetup(isFocused: boolean) {
  const { t } = useTranslation("budget");
  const [context, setContext] = useState<PersonalOwnerContext | null>(null);
  const [monthKey] = useState(getMonthKey());
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY_CODE);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [expenseDrafts, setExpenseDrafts] = useState<ExpenseDraft[]>([]);
  const [incomeDrafts, setIncomeDrafts] = useState<IncomeDraft[]>([
    createInitialIncomeDraft(),
  ]);
  const [debtDrafts, setDebtDrafts] = useState<DebtDraft[]>([]);
  const [goalDrafts, setGoalDrafts] = useState<GoalDraft[]>([]);
  const [preferences, setPreferences] = useState<BudgetPreferences>(
    DEFAULT_BUDGET_PREFERENCES,
  );
  const [persistedDraftState, setPersistedDraftState] =
    useState<PersistedBudgetSetupState | null>(null);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultWalletLocalId = wallets[0]?.local_id ?? null;

  const loadBudgetSetup = useCallback(async () => {
    const personalContext = await getPersonalContext();
    const [wallets, categories, debts, goals, savedPreferences, currentBudget] =
      await Promise.all([
        walletRepository.listWalletsByOwner(personalContext),
        categoryRepository.listCategoriesByOwner(
          personalContext.owner_type,
          personalContext.owner_local_id,
        ),
        debtRepository.listDebtsByOwner(
          personalContext.owner_type,
          personalContext.owner_local_id,
        ),
        goalRepository.listGoalsByOwner(
          personalContext.owner_type,
          personalContext.owner_local_id,
        ),
        budgetPreferencesRepository.getBudgetPreferences(
          personalContext.owner_local_id,
        ),
        budgetRepository.getBudgetByMonth(
          personalContext.owner_type,
          personalContext.owner_local_id,
          monthKey,
        ),
      ]);

    const [budgetIncomeItems, budgetAllocations] = currentBudget
      ? await Promise.all([
          budgetIncomeRepository.listBudgetIncomeItems(currentBudget.local_id),
          budgetRepository.listBudgetCategoryAllocations(
            currentBudget.local_id,
          ),
        ])
      : [[], []];

    const draftState = createBudgetSetupDrafts({
      budgetAllocations,
      budgetIncomeItems,
      categories,
      debts,
      goals,
    });

    return {
      currentBudget,
      draftState,
      personalContext,
      savedPreferences,
      wallets,
    };
  }, [monthKey]);

  const applyLoadedState = useCallback(
    (result: Awaited<ReturnType<typeof loadBudgetSetup>>) => {
      const nextDefaultWalletLocalId = result.wallets[0]?.local_id ?? null;
      const nextIncomeDrafts = result.draftState.incomeDrafts.map((draft) => ({
        ...draft,
        destination_wallet_local_id:
          draft.destination_wallet_local_id ?? nextDefaultWalletLocalId,
      }));

      setContext(result.personalContext);
      setWallets(result.wallets);
      setCurrencyCode(
        result.wallets[0]?.currency_code ?? DEFAULT_CURRENCY_CODE,
      );
      setPreferences(result.savedPreferences);
      setHasExistingPlan(Boolean(result.currentBudget));
      setExpenseDrafts(result.draftState.expenseDrafts);
      setIncomeDrafts(nextIncomeDrafts);
      setDebtDrafts(result.draftState.debtDrafts);
      setGoalDrafts(result.draftState.goalDrafts);
      setPersistedDraftState({
        debtDrafts: result.draftState.debtDrafts,
        expenseDrafts: result.draftState.expenseDrafts,
        goalDrafts: result.draftState.goalDrafts,
        incomeDrafts: nextIncomeDrafts,
        preferences: result.savedPreferences,
      });
    },
    [],
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isMounted = true;

    async function hydrate() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadBudgetSetup();

        if (!isMounted) {
          return;
        }

        applyLoadedState(result);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : t("errors.title");
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrate().catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : t("errors.title");
      setError(message);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [applyLoadedState, isFocused, loadBudgetSetup, t]);

  const updateIncomeDraft = useCallback(
    (clientId: string, updates: Partial<IncomeDraft>) => {
      setIncomeDrafts((currentDrafts) =>
        currentDrafts.map((draft) =>
          draft.client_id === clientId ? { ...draft, ...updates } : draft,
        ),
      );
    },
    [],
  );

  const updateExpenseDraft = useCallback(
    (categoryLocalId: string, updates: Partial<ExpenseDraft>) => {
      setExpenseDrafts((currentDrafts) =>
        currentDrafts.map((draft) =>
          draft.category_local_id === categoryLocalId
            ? { ...draft, ...updates }
            : draft,
        ),
      );
    },
    [],
  );

  const updateDebtDraft = useCallback(
    (clientId: string, updates: Partial<DebtDraft>) => {
      setDebtDrafts((currentDrafts) =>
        currentDrafts.map((draft) =>
          draft.client_id === clientId ? { ...draft, ...updates } : draft,
        ),
      );
    },
    [],
  );

  const updateGoalDraft = useCallback(
    (clientId: string, updates: Partial<GoalDraft>) => {
      setGoalDrafts((currentDrafts) =>
        currentDrafts.map((draft) =>
          draft.client_id === clientId ? { ...draft, ...updates } : draft,
        ),
      );
    },
    [],
  );

  const actions = useMemo<BudgetSetupActions>(
    () => ({
      addDebtDraft: () => {
        setDebtDrafts((currentDrafts) => [
          ...currentDrafts,
          createEmptyDebtDraft(),
        ]);
      },
      createEssentialCategory: async (name: string) => {
        if (!context) {
          throw new Error("No se encontro el contexto personal activo.");
        }

        const trimmedName = name.trim();

        if (!trimmedName) {
          throw new Error("La categoria esencial necesita un nombre.");
        }

        const createdCategory = await categoryRepository.createCategory({
          owner_type: context.owner_type,
          owner_local_id: context.owner_local_id,
          category_kind: "expense",
          name: trimmedName,
          budget_role: "essential",
          is_essential: true,
          is_system: false,
        });

        setExpenseDrafts((currentDrafts) => [
          ...currentDrafts,
          {
            category_local_id: createdCategory.local_id,
            category_name: createdCategory.name,
            amount: "0",
            expected_day: "",
            is_fixed: true,
            is_system: createdCategory.is_system,
          },
        ]);
        setPersistedDraftState((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                expenseDrafts: [
                  ...currentValue.expenseDrafts,
                  {
                    category_local_id: createdCategory.local_id,
                    category_name: createdCategory.name,
                    amount: "0",
                    expected_day: "",
                    is_fixed: true,
                    is_system: createdCategory.is_system,
                  },
                ],
              }
            : currentValue,
        );
        setError(null);
      },
      addGoalDraft: () => {
        setGoalDrafts((currentDrafts) => [
          ...currentDrafts,
          createEmptyGoalDraft(),
        ]);
      },
      addIncomeDraft: () => {
        setIncomeDrafts((currentDrafts) => [
          ...currentDrafts,
          createEmptyIncomeDraft(defaultWalletLocalId),
        ]);
      },
      removeEssentialCategory: async (categoryLocalId: string) => {
        const currentDraft = expenseDrafts.find(
          (draft) => draft.category_local_id === categoryLocalId,
        );

        if (!currentDraft) {
          return;
        }

        if (currentDraft.is_system) {
          throw new Error("Los esenciales predefinidos no se pueden eliminar.");
        }

        const updatedCategory = await categoryRepository.updateCategory(
          categoryLocalId,
          {
            budget_role: "flexible",
            is_essential: false,
          },
        );

        if (!updatedCategory) {
          throw new Error("No pudimos actualizar la categoria esencial.");
        }

        setExpenseDrafts((currentDrafts) =>
          currentDrafts.filter(
            (draft) => draft.category_local_id !== categoryLocalId,
          ),
        );
        setPersistedDraftState((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                expenseDrafts: currentValue.expenseDrafts.filter(
                  (draft) => draft.category_local_id !== categoryLocalId,
                ),
              }
            : currentValue,
        );
        setError(null);
      },
      renameEssentialCategory: async (
        categoryLocalId: string,
        nextName: string,
      ) => {
        const currentDraft = expenseDrafts.find(
          (draft) => draft.category_local_id === categoryLocalId,
        );

        if (!currentDraft) {
          return;
        }

        if (currentDraft.is_system) {
          throw new Error("Los esenciales predefinidos no se pueden editar.");
        }

        const updatedCategory = await categoryRepository.updateCategory(
          categoryLocalId,
          {
            name: nextName.trim(),
          },
        );

        if (!updatedCategory) {
          throw new Error("No pudimos actualizar la categoria esencial.");
        }

        setExpenseDrafts((currentDrafts) =>
          currentDrafts.map((draft) =>
            draft.category_local_id === categoryLocalId
              ? { ...draft, category_name: updatedCategory.name }
              : draft,
          ),
        );
        setPersistedDraftState((currentValue) =>
          currentValue
            ? {
                ...currentValue,
                expenseDrafts: currentValue.expenseDrafts.map((draft) =>
                  draft.category_local_id === categoryLocalId
                    ? { ...draft, category_name: updatedCategory.name }
                    : draft,
                ),
              }
            : currentValue,
        );
        setError(null);
      },
      removeDebtDraft: (clientId: string) => {
        setDebtDrafts((currentDrafts) =>
          currentDrafts.filter((draft) => draft.client_id !== clientId),
        );
      },
      removeGoalDraft: (clientId: string) => {
        setGoalDrafts((currentDrafts) =>
          currentDrafts.filter((draft) => draft.client_id !== clientId),
        );
      },
      removeIncomeDraft: (clientId: string) => {
        setIncomeDrafts((currentDrafts) =>
          currentDrafts.filter((draft) => draft.client_id !== clientId),
        );
      },
      setAllowFlexibleSpending: (value: boolean) => {
        setPreferences((currentValue) => ({
          ...currentValue,
          allow_flexible_spending: value,
        }));
      },
      setBufferMode: (value: BudgetBufferMode) => {
        setPreferences((currentValue) => ({
          ...currentValue,
          buffer_mode: value,
        }));
      },
      setBufferValue: (value: string) => {
        setPreferences((currentValue) => ({
          ...currentValue,
          buffer_value: Number(value.replace(",", ".")) || 0,
        }));
      },
      setPrimaryIncome: (clientId: string) => {
        setIncomeDrafts((currentDrafts) =>
          currentDrafts.map((draft) => ({
            ...draft,
            is_primary: draft.client_id === clientId,
          })),
        );
      },
      setPrioritizeDebtOverGoals: (value: boolean) => {
        setPreferences((currentValue) => ({
          ...currentValue,
          prioritize_debt_over_goals: value,
        }));
      },
      setStrategyType: (value: BudgetStrategyType) => {
        setPreferences((currentValue) => ({
          ...currentValue,
          strategy_type: value,
        }));
      },
      updateDebtDraft,
      updateExpenseDraft,
      updateGoalDraft,
      updateIncomeDraft,
    }),
    [
      context,
      defaultWalletLocalId,
      expenseDrafts,
      updateDebtDraft,
      updateExpenseDraft,
      updateGoalDraft,
      updateIncomeDraft,
    ],
  );

  const savePlan = useCallback(async (scope: BudgetSetupPersistScope = "all") => {
    if (!context) {
      const message = "No se encontro el contexto personal activo.";
      setError(message);
      throw new Error(message);
    }

    setIsSaving(true);
    setError(null);

    try {
      const sourceState = persistedDraftState;
      const input = buildBudgetSetupInput({
        owner_type: context.owner_type,
        owner_local_id: context.owner_local_id,
        month_key: monthKey,
        currency_code: currencyCode,
        debt_drafts:
          scope === "all" || scope === "debts"
            ? debtDrafts
            : sourceState?.debtDrafts ?? debtDrafts,
        expense_drafts:
          scope === "all" || scope === "essentials"
            ? expenseDrafts
            : sourceState?.expenseDrafts ?? expenseDrafts,
        goal_drafts:
          scope === "all" || scope === "goals"
            ? goalDrafts
            : sourceState?.goalDrafts ?? goalDrafts,
        income_drafts:
          scope === "all" || scope === "income"
            ? incomeDrafts
            : sourceState?.incomeDrafts ?? incomeDrafts,
        preferences:
          scope === "all" || scope === "preferences"
            ? preferences
            : sourceState?.preferences ?? preferences,
      });

      await budgetGeneratorService.generateMonthlyBudgetPlan(input);
      const refreshedState = await loadBudgetSetup();
      applyLoadedState(refreshedState);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : t("errors.saveTitle");
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    context,
    currencyCode,
    debtDrafts,
    expenseDrafts,
    goalDrafts,
    incomeDrafts,
    monthKey,
    persistedDraftState,
    preferences,
    t,
    applyLoadedState,
    loadBudgetSetup,
  ]);

  const generatePlan = useCallback(async () => {
    await savePlan("all");
  }, [savePlan]);

  return {
    actions,
    currencyCode,
    debtDrafts,
    error,
    expenseDrafts,
    generatePlan,
    goalDrafts,
    hasExistingPlan,
    incomeDrafts,
    isLoading,
    isSaving,
    monthKey,
    preferences,
    savePlan,
    wallets,
  };
}
