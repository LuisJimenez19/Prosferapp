import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Card, CardContent, Text } from "@/src/components/ui";
import type { BudgetSetupOverview } from "@/src/features/personal-finance/services/budget-setup-summary.service";
import { formatDateLabel } from "@/src/lib/dates";
import { formatCurrency } from "@/src/lib/money";
import { SectionHeader } from "./section-header";

type BudgetSetupSummarySectionProps = {
  currencyCode: string;
  overview: BudgetSetupOverview;
};

function SummaryMetricCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <View className="min-w-[48%] flex-1 rounded-lg border border-border/40 bg-card px-4 py-4">
      <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-muted-foreground">
        {label}
      </Text>
      <Text className="mt-2 text-xl font-extrabold tracking-[-0.8px] text-foreground">
        {value}
      </Text>
      <Text variant="muted" className="mt-1">
        {helper}
      </Text>
    </View>
  );
}

export function BudgetSetupSummarySection({
  currencyCode,
  overview,
}: BudgetSetupSummarySectionProps) {
  const { t } = useTranslation(["budget", "common"]);
  const hasSavingsTension = overview.goalShortfall > 0;
  const hasSavingsOpportunity = overview.extraSavingsCapacity > 0;

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <SectionHeader
          closeLabel={t("common:actions.confirm")}
          description={t("summary.description")}
          title={t("summary.title")}
        />

        <View className="flex-row flex-wrap gap-3">
          <SummaryMetricCard
            helper={t("summary.incomeHelper", {
              essentials: formatCurrency(
                overview.plannedEssentialTotal,
                currencyCode,
              ),
            })}
            label={t("summary.incomeLabel")}
            value={formatCurrency(overview.plannedIncomeTotal, currencyCode)}
          />
          <SummaryMetricCard
            helper={t("summary.debtHelper", {
              count: overview.activeDebtCount,
              deferred: overview.deferredDebtCount,
            })}
            label={t("summary.debtLabel")}
            value={formatCurrency(overview.plannedDebtTotal, currencyCode)}
          />
          <SummaryMetricCard
            helper={t("summary.goalCapacityHelper")}
            label={t("summary.goalCapacityLabel")}
            value={formatCurrency(overview.goalPlanningCapacity, currencyCode)}
          />
          <SummaryMetricCard
            helper={t("summary.bufferHelper")}
            label={t("summary.bufferLabel")}
            value={formatCurrency(overview.bufferTotal, currencyCode)}
          />
        </View>

        <View className="gap-3 rounded-lg border border-border/30 bg-secondary px-4 py-4">
          <Text weight="semibold">{t("summary.projectionTitle")}</Text>

          <Text variant="muted">
            {overview.projectedDebtFreeDate
              ? t("summary.projectedDebtFreeDate", {
                  count: overview.trackedDebtProjectionCount,
                  date: formatDateLabel(overview.projectedDebtFreeDate),
                })
              : t("summary.projectedDebtFreeDateMissing")}
          </Text>

          <Text variant="muted">
            {overview.trackedGoalProjectionCount > 0
              ? t("summary.projectedGoalValue", {
                  amount: formatCurrency(
                    overview.projectedGoalValueInTwelveMonths,
                    currencyCode,
                  ),
                })
              : t("summary.projectedGoalValueMissing")}
          </Text>

          {overview.upcomingGoalCompletionDate ? (
            <Text variant="muted">
              {t("summary.upcomingGoalCompletionDate", {
                date: formatDateLabel(overview.upcomingGoalCompletionDate),
              })}
            </Text>
          ) : null}
        </View>

        <View
          className={[
            "gap-2 rounded-lg border px-4 py-4",
            hasSavingsTension
              ? "border-destructive/30 bg-destructive/10"
              : hasSavingsOpportunity
                ? "border-primary/20 bg-primary/5"
                : "border-primary/20 bg-primary/5",
          ].join(" ")}
        >
          <Text
            weight="semibold"
            className={hasSavingsTension ? "text-destructive" : "text-primary"}
          >
            {hasSavingsTension
              ? t("summary.savingsTightTitle")
              : hasSavingsOpportunity
                ? t("summary.savingsOpportunityTitle")
                : t("summary.savingsBalancedTitle")}
          </Text>
          <Text variant="muted">
            {hasSavingsTension
              ? t("summary.savingsTightDescription", {
                  amount: formatCurrency(overview.goalShortfall, currencyCode),
                })
              : hasSavingsOpportunity
                ? t("summary.savingsOpportunityDescription", {
                    amount: formatCurrency(
                      overview.extraSavingsCapacity,
                      currencyCode,
                    ),
                  })
                : t("summary.savingsBalancedDescription")}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}
