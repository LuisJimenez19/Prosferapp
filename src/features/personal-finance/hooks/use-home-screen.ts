import { useEffect, useMemo, useState } from "react";

import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import { transactionRepository } from "@/src/features/personal-finance/repositories/transaction.repository";
import { walletRepository } from "@/src/features/personal-finance/repositories/wallet.repository";
import { budgetSummaryService } from "@/src/features/personal-finance/services/budget-summary.service";
import type { TransactionListItem } from "@/src/features/personal-finance/types/transaction";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";

export type BudgetOverview = NonNullable<
  Awaited<
    ReturnType<typeof budgetSummaryService.getCurrentMonthlyBudgetOverview>
  >
>;

export function useHomeScreen(isFocused: boolean) {
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(
    null,
  );
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isMounted = true;

    async function loadHomeData() {
      setIsLoading(true);
      setError(null);

      try {
        const context = await getPersonalContext();
        const [budgetResults, walletResults, transactionResults] =
          await Promise.all([
            budgetSummaryService.getCurrentMonthlyBudgetOverview(
              context.owner_type,
              context.owner_local_id,
            ),
            walletRepository.listWalletsByOwner(context),
            transactionRepository.listRecentTransactionsByOwner(
              context.owner_type,
              context.owner_local_id,
              10,
            ),
          ]);

        if (!isMounted) {
          return;
        }

        setBudgetOverview(budgetResults);
        setWallets(walletResults);
        setTransactions(transactionResults);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load local finance data.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData().catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load local finance data.";
      setError(message);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  const featuredWallet = useMemo(
    () => wallets.find((wallet) => wallet.is_default) ?? wallets[0] ?? null,
    [wallets],
  );
  const secondaryWallets = useMemo(
    () =>
      wallets
        .filter((wallet) => wallet.local_id !== featuredWallet?.local_id)
        .slice(0, 3),
    [featuredWallet?.local_id, wallets],
  );
  const latestTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);
  const activeDebtCount =
    budgetOverview?.debts.filter((debt) => debt.status === "active").length ?? 0;
  const activeGoalCount =
    budgetOverview?.goals.filter((goal) => goal.status === "active").length ?? 0;

  return {
    activeDebtCount,
    activeGoalCount,
    budgetOverview,
    error,
    featuredWallet,
    isLoading,
    latestTransactions,
    secondaryWallets,
    wallets,
  };
}
