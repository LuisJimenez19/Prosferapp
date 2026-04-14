import { useEffect, useMemo, useState } from "react";

import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import { budgetSummaryService } from "@/src/features/personal-finance/services/budget-summary.service";

export type DashboardBudgetOverview = NonNullable<
  Awaited<
    ReturnType<typeof budgetSummaryService.getCurrentMonthlyBudgetOverview>
  >
>;

export function useDashboardScreen(isFocused: boolean) {
  const [budgetOverview, setBudgetOverview] =
    useState<DashboardBudgetOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);

      try {
        const context = await getPersonalContext();
        const overview = await budgetSummaryService.getCurrentMonthlyBudgetOverview(
          context.owner_type,
          context.owner_local_id,
        );

        if (!isMounted) {
          return;
        }

        setBudgetOverview(overview);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load local dashboard data.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData().catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load local dashboard data.";
      setError(message);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  const activeDebtCount = useMemo(
    () =>
      budgetOverview?.debts.filter((debt) => debt.status === "active").length ?? 0,
    [budgetOverview],
  );
  const activeGoalCount = useMemo(
    () =>
      budgetOverview?.goals.filter((goal) => goal.status === "active").length ?? 0,
    [budgetOverview],
  );

  return {
    activeDebtCount,
    activeGoalCount,
    budgetOverview,
    error,
    isLoading,
  };
}
