import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  EmptyState,
  HelpTooltip,
  Text,
} from "@/src/components/ui";
import type { BudgetOverview } from "@/src/features/personal-finance/hooks/use-home-screen";
import { formatCurrency } from "@/src/lib/money";

type HomeBudgetSectionProps = {
  activeDebtCount: number;
  activeGoalCount: number;
  budgetOverview: BudgetOverview | null;
  onQuickAdd: () => void;
  onSetupPlan: () => void;
};

function BudgetMetricRow({
  actual,
  currencyCode,
  label,
  planned,
}: {
  actual: number;
  currencyCode: string;
  label: string;
  planned: number;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-lg bg-card/60 px-3 py-3">
      <View className="gap-1">
        <Text className="text-[12px] font-semibold uppercase tracking-[1px] text-muted-foreground">
          {label}
        </Text>
        <Text className="text-[15px] font-semibold text-foreground">
          {formatCurrency(actual, currencyCode)}
        </Text>
      </View>

      <Text className="text-sm font-medium text-muted-foreground">
        {formatCurrency(planned, currencyCode)}
      </Text>
    </View>
  );
}

function SummaryStatCard({
  helper,
  label,
  tooltipDescription,
  tooltipTitle,
  value,
}: {
  helper: string;
  label: string;
  tooltipDescription: string;
  tooltipTitle: string;
  value: string;
}) {
  const { t } = useTranslation("common");

  return (
    <View className="flex-1 rounded-lg border border-border/40 bg-card px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="text-[12px] font-semibold uppercase tracking-[1px] text-muted-foreground">
          {label}
        </Text>
        <HelpTooltip
          className="h-7 w-7"
          closeLabel={t("actions.confirm")}
          description={tooltipDescription}
          title={tooltipTitle}
        />
      </View>
      <Text className="mt-2 text-[28px] font-extrabold tracking-[-0.8px] text-foreground">
        {value}
      </Text>
      <Text variant="muted" className="mt-1">
        {helper}
      </Text>
    </View>
  );
}

function OverviewCard({
  overview,
  onQuickAdd,
  onSetupPlan,
}: {
  overview: BudgetOverview;
  onQuickAdd: () => void;
  onSetupPlan: () => void;
}) {
  const { t } = useTranslation("home");
  const statusClassName =
    overview.summary.deviation_status === "on_track"
      ? "bg-success/15 text-success"
      : overview.summary.deviation_status === "warning"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-destructive/15 text-destructive";

  return (
    <View className="overflow-hidden rounded-lg border border-border/40 bg-secondary px-5 py-5">
      <View className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10" />
      <View className="absolute bottom-4 right-5 h-12 w-12 rounded-lg bg-primary/5" />

      <View className="gap-3">
        <Text variant="caption" className="text-primary">
          {t("plan.monthLabel", { month: overview.summary.month_key })}
        </Text>

        <View className="flex items-start justify-between gap-3">
          <View className="flex-row items-center justify-between  gap-2 w-full ">
            <Text className="text-4xl font-extrabold leading-[40px] tracking-[-1.2px] text-primary">
              {formatCurrency(
                overview.summary.planned_income_total,
                overview.summary.currency_code,
              )}
            </Text>
            <View className={`rounded-full px-3 py-1 ${statusClassName}`}>
              <Text className="text-[11px] font-bold uppercase tracking-[1px]">
                {t(`plan.status.${overview.summary.deviation_status}`)}
              </Text>
            </View>
          </View>
          <Text variant="muted">{t("plan.description")}</Text>
        </View>

        <View className="gap-2">
          <BudgetMetricRow
            actual={overview.summary.actual_essential_total}
            currencyCode={overview.summary.currency_code}
            label={t("plan.metrics.essentials")}
            planned={overview.summary.planned_essential_total}
          />
          <BudgetMetricRow
            actual={overview.summary.actual_debt_total}
            currencyCode={overview.summary.currency_code}
            label={t("plan.metrics.debts")}
            planned={overview.summary.planned_debt_total}
          />
          <BudgetMetricRow
            actual={overview.summary.actual_goal_total}
            currencyCode={overview.summary.currency_code}
            label={t("plan.metrics.goals")}
            planned={overview.summary.planned_goal_total}
          />
        </View>

        <Text className="text-[13px] font-semibold text-muted-foreground">
          {t("plan.metrics.flexibleRemaining")}:{" "}
          {formatCurrency(
            overview.summary.remaining_flexible,
            overview.summary.currency_code,
          )}
        </Text>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-3">
        <Button className="px-4" onPress={onQuickAdd}>
          {t("plan.addTransactionAction")}
        </Button>
        <Button variant="outline" className="px-4" onPress={onSetupPlan}>
          {t("plan.editAction")}
        </Button>
      </View>
    </View>
  );
}

function BudgetAlertsCard({ overview }: { overview: BudgetOverview }) {
  const { t } = useTranslation("home");

  if (overview.alerts.length === 0) {
    return (
      <Card>
        <CardContent className="gap-2 py-6">
          <Text weight="semibold">{t("plan.alerts.calmTitle")}</Text>
          <Text variant="muted">{t("plan.alerts.calmDescription")}</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning/40 bg-warning/10">
      <CardContent className="gap-3 py-5">
        <Text weight="semibold">{t("plan.alerts.title")}</Text>
        {overview.alerts.map((alert) => (
          <View key={alert.kind} className="gap-1 rounded-lg bg-card px-4 py-3">
            <Text weight="semibold">{alert.title}</Text>
            <Text variant="muted">{alert.description}</Text>
          </View>
        ))}
      </CardContent>
    </Card>
  );
}

export function HomeBudgetSection({
  activeDebtCount,
  activeGoalCount,
  budgetOverview,
  onQuickAdd,
  onSetupPlan,
}: HomeBudgetSectionProps) {
  const { t } = useTranslation("home");

  if (!budgetOverview) {
    return (
      <EmptyState
        title={t("plan.emptyTitle")}
        description={t("plan.emptyDescription")}
        action={<Button onPress={onSetupPlan}>{t("plan.setupAction")}</Button>}
      />
    );
  }

  return (
    <View className="gap-3">
      <OverviewCard
        overview={budgetOverview}
        onQuickAdd={onQuickAdd}
        onSetupPlan={onSetupPlan}
      />

      <View className="flex-row gap-3">
        <SummaryStatCard
          helper={t("plan.counters.debtsHelper", {
            count: activeDebtCount,
          })}
          label={t("plan.counters.debtsLabel")}
          tooltipDescription={t("plan.counters.debtsTooltipDescription")}
          tooltipTitle={t("plan.counters.debtsTooltipTitle")}
          value={String(activeDebtCount)}
        />
        <SummaryStatCard
          helper={t("plan.counters.goalsHelper", {
            count: activeGoalCount,
          })}
          label={t("plan.counters.goalsLabel")}
          tooltipDescription={t("plan.counters.goalsTooltipDescription")}
          tooltipTitle={t("plan.counters.goalsTooltipTitle")}
          value={String(activeGoalCount)}
        />
      </View>

      <BudgetAlertsCard overview={budgetOverview} />
    </View>
  );
}
