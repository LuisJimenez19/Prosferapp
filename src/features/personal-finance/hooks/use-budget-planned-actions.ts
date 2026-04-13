import { useCallback, useEffect, useState } from "react";

import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import {
  confirmBudgetPlannedAction,
  getBudgetActionCenter,
} from "@/src/features/personal-finance/services/budget-actions.service";
import type {
  BudgetPlannedAction,
  BudgetPlannedActionSummary,
} from "@/src/features/personal-finance/types/budget-actions";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { dateInputToIsoString, getMonthKey } from "@/src/lib/dates";

type PersonalOwnerContext = Awaited<ReturnType<typeof getPersonalContext>>;

export function useBudgetPlannedActions(
  isFocused: boolean,
  refreshKey = 0,
) {
  const [context, setContext] = useState<PersonalOwnerContext | null>(null);
  const [currencyCode, setCurrencyCode] = useState("ARS");
  const [hasBudget, setHasBudget] = useState(false);
  const [plannedActions, setPlannedActions] = useState<BudgetPlannedAction[]>([]);
  const [summary, setSummary] = useState<BudgetPlannedActionSummary>({
    pending_total_amount: 0,
    ready_count: 0,
    recorded_count: 0,
    scheduled_count: 0,
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletByActionId, setSelectedWalletByActionId] = useState<
    Record<string, string | null>
  >({});
  const [selectedDateByActionId, setSelectedDateByActionId] = useState<
    Record<string, string>
  >({});
  const [noteByActionId, setNoteByActionId] = useState<Record<string, string>>({});
  const [acknowledgedActionIds, setAcknowledgedActionIds] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingActionId, setIsConfirmingActionId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const monthKey = getMonthKey();

  const loadActionCenter = useCallback(async () => {
    const personalContext = await getPersonalContext();
    const result = await getBudgetActionCenter({
      monthKey,
      owner_local_id: personalContext.owner_local_id,
      owner_type: personalContext.owner_type,
    });

    setContext(personalContext);
    setCurrencyCode(result.currencyCode);
    setHasBudget(Boolean(result.budget));
    setPlannedActions(result.plannedActions);
    setSummary(result.summary);
    setWallets(result.wallets);
    setSelectedWalletByActionId(
      Object.fromEntries(
        result.plannedActions.map((action) => [
          action.id,
          action.default_wallet_local_id,
        ]),
      ),
    );
    setSelectedDateByActionId(
      Object.fromEntries(
        result.plannedActions.map((action) => [action.id, action.default_date]),
      ),
    );
    setNoteByActionId(
      Object.fromEntries(
        result.plannedActions.map((action) => [action.id, action.default_note]),
      ),
    );
    setAcknowledgedActionIds({});
  }, [monthKey]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isMounted = true;

    async function hydrate() {
      setIsLoading(true);
      setError(null);

      try {
        await loadActionCenter();
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar los movimientos del plan.",
        );
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

      setError(
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar los movimientos del plan.",
      );
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isFocused, loadActionCenter, refreshKey]);

  const setSelectedWallet = useCallback((actionId: string, walletLocalId: string) => {
    setSelectedWalletByActionId((current) => ({
      ...current,
      [actionId]: walletLocalId,
    }));
  }, []);

  const setSelectedDate = useCallback((actionId: string, nextDate: string) => {
    setSelectedDateByActionId((current) => ({
      ...current,
      [actionId]: nextDate,
    }));
  }, []);

  const setActionNote = useCallback((actionId: string, nextNote: string) => {
    setNoteByActionId((current) => ({
      ...current,
      [actionId]: nextNote,
    }));
  }, []);

  const setActionAcknowledged = useCallback(
    (actionId: string, isAcknowledged: boolean) => {
      setAcknowledgedActionIds((current) => ({
        ...current,
        [actionId]: isAcknowledged,
      }));
    },
    [],
  );

  const confirmAction = useCallback(
    async (actionId: string) => {
      const action = plannedActions.find((currentAction) => currentAction.id === actionId);

      if (!action) {
        throw new Error("No encontramos el movimiento seleccionado.");
      }

      if (!context) {
        throw new Error("El contexto personal no esta disponible.");
      }

      const walletLocalId = selectedWalletByActionId[actionId] ?? null;
      const occurredAtDate = selectedDateByActionId[actionId] ?? action.default_date;

      if (!walletLocalId) {
        throw new Error("Selecciona una billetera antes de registrar el movimiento.");
      }

      if (!acknowledgedActionIds[actionId]) {
        throw new Error(
          "Confirma explicitamente que este movimiento ya ocurrio antes de guardarlo.",
        );
      }

      setIsConfirmingActionId(actionId);
      setError(null);

      try {
        await confirmBudgetPlannedAction({
          amount: action.amount,
          category_local_id: action.category_local_id,
          note: noteByActionId[actionId]?.trim() || action.default_note,
          occurred_at: dateInputToIsoString(occurredAtDate),
          owner_local_id: context.owner_local_id,
          owner_type: context.owner_type,
          reference_local_id: action.reference_local_id,
          reference_type: action.reference_type,
          wallet_local_id: walletLocalId,
        });
        await loadActionCenter();
      } catch (confirmError) {
        const message =
          confirmError instanceof Error
            ? confirmError.message
            : "No pudimos registrar el movimiento del plan.";
        setError(message);
        throw confirmError;
      } finally {
        setIsConfirmingActionId(null);
      }
    },
    [
      acknowledgedActionIds,
      context,
      loadActionCenter,
      noteByActionId,
      plannedActions,
      selectedDateByActionId,
      selectedWalletByActionId,
    ],
  );

  return {
    acknowledgedActionIds,
    confirmAction,
    currencyCode,
    error,
    hasBudget,
    isConfirmingActionId,
    isLoading,
    noteByActionId,
    plannedActions,
    selectedDateByActionId,
    selectedWalletByActionId,
    setActionAcknowledged,
    setActionNote,
    setSelectedDate,
    setSelectedWallet,
    summary,
    wallets,
  };
}
