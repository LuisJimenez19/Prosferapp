import { useCallback, useEffect, useMemo, useState } from "react";

import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import { transactionRepository } from "@/src/features/personal-finance/repositories/transaction.repository";
import type {
  TransactionKind,
  TransactionListItem,
} from "@/src/features/personal-finance/types/transaction";

export type TransactionScopeFilter =
  | "all"
  | "essential"
  | "debt"
  | "goal"
  | "flexible";
export type TransactionTypeFilter = "all" | TransactionKind;

function matchesScopeFilter(
  transaction: TransactionListItem,
  scopeFilter: TransactionScopeFilter,
) {
  const isDebtTransaction =
    transaction.reference_type === "debt" ||
    transaction.category_budget_role === "debt_payment";
  const isGoalTransaction =
    transaction.reference_type === "goal" ||
    transaction.category_budget_role === "goal_contribution";
  const isEssentialTransaction = transaction.category_budget_role === "essential";

  switch (scopeFilter) {
    case "essential":
      return isEssentialTransaction;
    case "debt":
      return isDebtTransaction;
    case "goal":
      return isGoalTransaction;
    case "flexible":
      return (
        transaction.transaction_type === "expense" &&
        !isEssentialTransaction &&
        !isDebtTransaction &&
        !isGoalTransaction
      );
    case "all":
    default:
      return true;
  }
}

export function useTransactionsScreen(isFocused: boolean) {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] =
    useState<TransactionScopeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [walletFilter, setWalletFilter] = useState<string>("all");

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const context = await getPersonalContext();
      const transactionResults = await transactionRepository.listTransactionsByOwner(
        context.owner_type,
        context.owner_local_id,
      );

      setTransactions(transactionResults);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load local transactions.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    loadTransactions().catch((loadError) => {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load local transactions.";
      setError(message);
      setIsLoading(false);
    });
  }, [isFocused, loadTransactions]);

  const walletOptions = useMemo(() => {
    const entries = new Map<string, string>();

    for (const transaction of transactions) {
      entries.set(transaction.wallet_local_id, transaction.wallet_name);
    }

    return Array.from(entries.entries())
      .map(([local_id, name]) => ({ local_id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [transactions]);

  useEffect(() => {
    if (
      walletFilter !== "all" &&
      !walletOptions.some((wallet) => wallet.local_id === walletFilter)
    ) {
      setWalletFilter("all");
    }
  }, [walletFilter, walletOptions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "all" || transaction.transaction_type === typeFilter;
      const matchesWallet =
        walletFilter === "all" || transaction.wallet_local_id === walletFilter;

      return (
        matchesType &&
        matchesWallet &&
        matchesScopeFilter(transaction, scopeFilter)
      );
    });
  }, [scopeFilter, transactions, typeFilter, walletFilter]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (summary, transaction) => {
        if (transaction.transaction_type === "income") {
          summary.income += transaction.amount;
        } else {
          summary.expense += transaction.amount;
        }

        return summary;
      },
      {
        expense: 0,
        income: 0,
      },
    );
  }, [filteredTransactions]);

  return {
    error,
    filteredTransactions,
    isLoading,
    loadTransactions,
    scopeFilter,
    setScopeFilter,
    setTypeFilter,
    setWalletFilter,
    totals,
    transactions,
    typeFilter,
    walletFilter,
    walletOptions,
  };
}
