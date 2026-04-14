import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Pie, PolarChart } from "victory-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Badge, Card, CardContent, Progress, Text } from "@/src/components/ui";
import type { DashboardBudgetOverview } from "@/src/features/personal-finance/hooks/use-dashboard-screen";
import {
  getCategoryVisuals,
  getWalletVisuals,
} from "@/src/features/personal-finance/services/presentation";
import type {
  BudgetComparisonBlock,
  BudgetDeviationStatus,
  EssentialBudgetBreakdownItem,
  GeneratedMonthlyBudgetSummary,
} from "@/src/features/personal-finance/types/budget";
import { formatCurrency } from "@/src/lib/money";
import { getThemeColors } from "@/src/lib/theme";

type DashboardBudgetInsightsProps = {
  activeDebtCount: number;
  activeGoalCount: number;
  overview: DashboardBudgetOverview;
};

type ChartDatum = {
  color: string;
  label: string;
  value: number;
};
type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const CHART_PALETTE = {
  light: [
    "#2E7AF0",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#06B6D4",
    "#EF4444",
    "#64748B",
  ],
  dark: [
    "#60A5FA",
    "#34D399",
    "#FBBF24",
    "#C084FC",
    "#22D3EE",
    "#FB7185",
    "#CBD5E1",
  ],
} as const;

function getChartColor(
  index: number,
  colorScheme: ReturnType<typeof useColorScheme>,
) {
  const palette =
    colorScheme === "dark" ? CHART_PALETTE.dark : CHART_PALETTE.light;
  return palette[index % palette.length];
}

function getAreaColor(
  key: Exclude<BudgetComparisonBlock["key"], "income">,
  colorScheme: ReturnType<typeof useColorScheme>,
) {
  const isDark = colorScheme === "dark";

  switch (key) {
    case "essentials":
      return isDark ? "#60A5FA" : "#2563EB";
    case "debts":
      return isDark ? "#FBBF24" : "#D97706";
    case "goals":
      return isDark ? "#34D399" : "#059669";
    case "flexible":
    default:
      return isDark ? "#C084FC" : "#7C3AED";
  }
}

function getProgressValue(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return 0;
  }

  return Math.min(Math.max(ratio * 100, 4), 100);
}

function getComparisonIconName(
  key: BudgetComparisonBlock["key"],
): MaterialIconName {
  switch (key) {
    case "income":
      return "north-east";
    case "essentials":
      return "shopping-basket";
    case "debts":
      return "credit-score";
    case "goals":
      return "savings";
    case "flexible":
      return "tune";
    default:
      return "analytics";
  }
}

function getComparisonTone(block: BudgetComparisonBlock) {
  const isPositive =
    (block.comparison_mode === "cap" && block.state !== "above") ||
    (block.comparison_mode === "target" && block.state !== "below");

  if (block.state === "aligned") {
    return {
      badgeClassName: "bg-primary/10 text-primary",
      fillClassName: "bg-primary",
      iconClassName: "bg-primary/10 text-primary",
      iconColor: "primary" as const,
      iconName: getComparisonIconName(block.key),
    };
  }

  if (isPositive) {
    return {
      badgeClassName: "bg-success/15 text-success",
      fillClassName: "bg-success",
      iconClassName: "bg-success/15 text-success",
      iconColor: "success" as const,
      iconName: getComparisonIconName(block.key),
    };
  }

  return {
    badgeClassName: "bg-destructive/15 text-destructive",
    fillClassName: "bg-destructive",
    iconClassName: "bg-destructive/15 text-destructive",
    iconColor: "destructive" as const,
    iconName: getComparisonIconName(block.key),
  };
}

function getComparisonStatusLabel(
  block: BudgetComparisonBlock,
  t: ReturnType<typeof useTranslation>["t"],
) {
  return t(`comparisons.status.${block.comparison_mode}.${block.state}`);
}

function getComparisonDeltaLabel(
  block: BudgetComparisonBlock,
  currencyCode: string,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const amount = formatCurrency(
    Math.abs(block.difference_amount),
    currencyCode,
  );

  if (block.state === "aligned") {
    return t(`comparisons.delta.${block.comparison_mode}.aligned`);
  }

  return t(`comparisons.delta.${block.comparison_mode}.${block.state}`, {
    amount,
  });
}

function getEssentialStatusLabel(
  item: EssentialBudgetBreakdownItem,
  t: ReturnType<typeof useTranslation>["t"],
) {
  return t(`essentials.status.${item.state}`);
}

function getEssentialDeltaLabel(
  item: EssentialBudgetBreakdownItem,
  currencyCode: string,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const amount = formatCurrency(Math.abs(item.difference_amount), currencyCode);

  if (item.state === "aligned") {
    return t("essentials.delta.aligned");
  }

  return t(`essentials.delta.${item.state}`, {
    amount,
  });
}

function getDeviationBadgeClassName(status: BudgetDeviationStatus) {
  if (status === "off_track") {
    return "bg-destructive/15 text-destructive";
  }

  if (status === "warning") {
    return "bg-warning/15 text-warning-foreground";
  }

  return "bg-success/15 text-success";
}

function getDeviationBadgeTextClassName(status: BudgetDeviationStatus) {
  if (status === "off_track") {
    return "text-destructive";
  }

  if (status === "warning") {
    return "text-warning-foreground";
  }

  return "text-success";
}

function getPrimaryInsight(input: {
  currencyCode: string;
  summary: GeneratedMonthlyBudgetSummary;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const { currencyCode, summary, t } = input;
  const essentialsBlock = summary.comparison_blocks.find(
    (block) => block.key === "essentials",
  );
  const flexibleBlock = summary.comparison_blocks.find(
    (block) => block.key === "flexible",
  );
  const debtsBlock = summary.comparison_blocks.find(
    (block) => block.key === "debts",
  );
  const goalsBlock = summary.comparison_blocks.find(
    (block) => block.key === "goals",
  );

  if (summary.deviation_status === "off_track") {
    if (flexibleBlock?.state === "above") {
      return {
        iconName: "report-gmailerrorred" as const,
        message: t("insights.flexibleExceeded", {
          amount: formatCurrency(
            Math.abs(flexibleBlock.difference_amount),
            currencyCode,
          ),
        }),
      };
    }

    if (essentialsBlock?.state === "above") {
      const overspentCategories = summary.essential_breakdown.filter(
        (item) => item.state === "above",
      );
      const overspentAmount = overspentCategories.reduce(
        (sum, item) => sum + Math.max(item.difference_amount, 0),
        0,
      );

      return {
        iconName: "warning-amber" as const,
        message: t("insights.essentialsExceeded", {
          amount: formatCurrency(overspentAmount, currencyCode),
          count: overspentCategories.length,
        }),
      };
    }

    return {
      iconName: "report-gmailerrorred" as const,
      message: t("insights.offTrackFallback"),
    };
  }

  if (debtsBlock?.state === "below" && goalsBlock?.state === "below") {
    return {
      iconName: "pending-actions" as const,
      message: t("insights.debtsAndGoalsPending", {
        debts: formatCurrency(
          Math.abs(debtsBlock.difference_amount),
          currencyCode,
        ),
        goals: formatCurrency(
          Math.abs(goalsBlock.difference_amount),
          currencyCode,
        ),
      }),
    };
  }

  if (debtsBlock?.state === "below") {
    return {
      iconName: "credit-score" as const,
      message: t("insights.debtsPending", {
        amount: formatCurrency(
          Math.abs(debtsBlock.difference_amount),
          currencyCode,
        ),
      }),
    };
  }

  if (goalsBlock?.state === "below") {
    return {
      iconName: "savings" as const,
      message: t("insights.goalsPending", {
        amount: formatCurrency(
          Math.abs(goalsBlock.difference_amount),
          currencyCode,
        ),
      }),
    };
  }

  return {
    iconName: "tune" as const,
    message: t("insights.flexibleRemaining", {
      amount: formatCurrency(summary.remaining_flexible, currencyCode),
    }),
  };
}

function ChartLegend({
  currencyCode,
  data,
}: {
  currencyCode: string;
  data: ChartDatum[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View className="gap-2">
      {data.map((item) => (
        <View
          key={item.label}
          className="flex-row items-center justify-between gap-3 rounded-xl border border-border/40 bg-card px-4 py-3"
        >
          <View className="flex-1 flex-row items-center gap-3">
            <View
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <Text weight="medium" className="text-sm text-foreground">
              {item.label}
            </Text>
          </View>
          <Text weight="semibold" className="text-sm text-foreground">
            {formatCurrency(item.value, currencyCode)}
          </Text>
          <Text className="w-12 text-right text-xs font-medium text-muted-foreground">
            {total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DonutChartCard({
  currencyCode,
  data,
  emptyDescription,
  emptyTitle,
  modeLabel,
  centerCaption,
  subtitle,
  title,
}: {
  currencyCode: string;
  data: ChartDatum[];
  emptyDescription: string;
  emptyTitle: string;
  modeLabel: string;
  centerCaption: string;
  subtitle: string;
  title: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <View className="gap-2 items-start ">
          <Badge className="w-max  " variant="secondary">
            <Text>{modeLabel}</Text>
          </Badge>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text weight="semibold" className="text-base text-foreground">
                {title}
              </Text>
              <Text variant="muted">{subtitle}</Text>
            </View>
          </View>
        </View>

        {data.length === 0 ? (
          <View className="rounded-xl border border-border/40 bg-background px-4 py-6">
            <Text weight="semibold" className="text-base text-foreground">
              {emptyTitle}
            </Text>
            <Text variant="muted" className="mt-1">
              {emptyDescription}
            </Text>
          </View>
        ) : (
          <>
            <View className="relative h-60 ">
              <PolarChart
                containerStyle={{ height: 240 }}
                data={data}
                labelKey="label"
                valueKey="value"
                colorKey="color"
              >
                <Pie.Chart innerRadius="64%">{() => <Pie.Slice />}</Pie.Chart>
              </PolarChart>

              <View
                pointerEvents="none"
                className="absolute inset-0 items-center justify-center px-10"
              >
                <Text className="text-xs font-semibold uppercase tracking-wide ">
                  {centerCaption}
                </Text>
                <Text
                  weight="bold"
                  className="mt-1 text-center text-2xl leading-8 text-foreground"
                >
                  {formatCurrency(total, currencyCode)}
                </Text>
              </View>
            </View>

            <ChartLegend currencyCode={currencyCode} data={data} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ComparisonMetricCard({
  block,
  currencyCode,
}: {
  block: BudgetComparisonBlock;
  currencyCode: string;
}) {
  const { t } = useTranslation("dashboard");
  const colors = getThemeColors(useColorScheme());
  const tone = getComparisonTone(block);

  return (
    <View className="flex-1 rounded-xl border border-border/40 bg-card px-4 py-4">
      <View className="gap-3">
        <View className="flex-row items-start justify-between flex-wrap-reverse gap-y-1">
          <View className=" gap-1 ">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`comparisons.items.${block.key}`)}
            </Text>
            <Text weight="bold" className="text-sm text-foreground ">
              {formatCurrency(block.actual_amount, currencyCode)}
            </Text>
          </View>

          <View
            className={`h-10 w-10 items-center justify-center rounded-lg ${tone.iconClassName}`}
          >
            <MaterialIcons
              color={colors[tone.iconColor]}
              name={tone.iconName}
              size={18}
            />
          </View>
        </View>

        <View
          className={`self-start rounded-full px-3 py-1 ${tone.badgeClassName}`}
        >
          <Text className="text-xs font-semibold uppercase tracking-wide">
            {getComparisonStatusLabel(block, t) + " "}
          </Text>
        </View>

        <Progress
          className="bg-border/50"
          indicatorClassName={tone.fillClassName}
          value={getProgressValue(block.progress_ratio)}
        />

        <View className="gap-1">
          <Text variant="muted" className="text-xs">
            {t("comparisons.plannedLabel", {
              amount: formatCurrency(block.planned_amount, currencyCode),
            })}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground">
            {getComparisonDeltaLabel(block, currencyCode, t)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EssentialBreakdownCard({
  currencyCode,
  items,
}: {
  currencyCode: string;
  items: EssentialBudgetBreakdownItem[];
}) {
  const { t } = useTranslation("dashboard");
  const colorScheme = useColorScheme();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="gap-2 py-6">
          <Text weight="semibold">{t("essentials.emptyTitle")}</Text>
          <Text variant="muted">{t("essentials.emptyDescription")}</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <View className="gap-1">
          <Text weight="semibold" className="text-base text-foreground">
            {t("essentials.title")}
          </Text>
          <Text variant="muted">{t("essentials.subtitle")}</Text>
        </View>

        {items.map((item) => {
          const visuals = getCategoryVisuals(
            {
              category_kind: "expense",
              color_hex: null,
              icon_name: null,
              name: item.category_name,
            },
            colorScheme,
          );
          const isOver = item.state === "above";
          const fillClassName = isOver ? "bg-destructive" : "bg-success";
          const badgeClassName = isOver
            ? "bg-destructive/15 text-destructive"
            : item.state === "aligned"
              ? "bg-primary/10 text-primary"
              : "bg-success/15 text-success";

          return (
            <View
              key={item.category_local_id}
              className="gap-3 rounded-xl border border-border/40 bg-background px-4 py-4"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-lg border"
                    style={{
                      backgroundColor: visuals.backgroundColor,
                      borderColor: visuals.borderColor,
                    }}
                  >
                    <MaterialIcons
                      color={visuals.iconColor}
                      name={visuals.iconName}
                      size={18}
                    />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text
                      weight="semibold"
                      className="text-base text-foreground"
                    >
                      {item.category_name}
                    </Text>
                    <Text variant="muted">
                      {t("essentials.plannedVsActual", {
                        actual: formatCurrency(
                          item.actual_amount,
                          currencyCode,
                        ),
                        planned: formatCurrency(
                          item.allocated_amount,
                          currencyCode,
                        ),
                      })}
                    </Text>
                  </View>
                </View>

                <View className={`rounded-full px-3 py-1 ${badgeClassName}`}>
                  <Text className="text-xs font-semibold uppercase tracking-wide">
                    {getEssentialStatusLabel(item, t)}
                  </Text>
                </View>
              </View>

              <Progress
                className="bg-border/50"
                indicatorClassName={fillClassName}
                value={getProgressValue(item.progress_ratio)}
              />

              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-sm font-medium text-muted-foreground">
                  {getEssentialDeltaLabel(item, currencyCode, t)}
                </Text>
                <Text className="text-sm font-medium text-muted-foreground">
                  {t("essentials.planLabel", {
                    amount: formatCurrency(item.allocated_amount, currencyCode),
                  })}
                </Text>
              </View>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
}

function QuickInsightsCard({
  activeDebtCount,
  activeGoalCount,
  summary,
}: {
  activeDebtCount: number;
  activeGoalCount: number;
  summary: GeneratedMonthlyBudgetSummary;
}) {
  const { t } = useTranslation("dashboard");
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const walletVisuals = getWalletVisuals("digital", colorScheme);
  const primaryInsight = getPrimaryInsight({
    currencyCode: summary.currency_code,
    summary,
    t,
  });

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5">
      <CardContent className="gap-4 py-5">
        <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10" />
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: walletVisuals.backgroundColor }}
          >
            <MaterialIcons color={colors.primary} name="insights" size={20} />
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between gap-3">
              <Text weight="semibold" className="text-base text-foreground">
                {t("insights.title")}
              </Text>
              <Badge
                variant="outline"
                className={getDeviationBadgeClassName(summary.deviation_status)}
              >
                <Text
                  className={`text-xs font-semibold uppercase tracking-wide ${getDeviationBadgeTextClassName(summary.deviation_status)}`}
                >
                  {t(`insights.badges.${summary.deviation_status}`)}
                </Text>
              </Badge>
            </View>
            <Text variant="muted">
              {t("insights.debts", { count: activeDebtCount })}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row items-start gap-3 rounded-xl border border-border/30 bg-card/70 px-4 py-3">
            <MaterialIcons
              color={colors.primary}
              name={primaryInsight.iconName}
              size={18}
            />
            <Text variant="muted" className="flex-1">
              {primaryInsight.message}
            </Text>
          </View>
          <Text variant="muted">
            {t("insights.goals", { count: activeGoalCount })}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

export function DashboardBudgetInsights({
  activeDebtCount,
  activeGoalCount,
  overview,
}: DashboardBudgetInsightsProps) {
  const { t } = useTranslation("dashboard");
  const colorScheme = useColorScheme();

  const essentialChart = useMemo(() => {
    const hasActualValues = overview.summary.essential_breakdown.some(
      (item) => item.actual_amount > 0,
    );
    const data = overview.summary.essential_breakdown
      .map((item, index) => {
        return {
          color: getChartColor(index, colorScheme),
          label: item.category_name,
          value: hasActualValues ? item.actual_amount : item.allocated_amount,
        } satisfies ChartDatum;
      })
      .filter((item) => item.value > 0);

    return {
      data,
      modeLabel: hasActualValues
        ? t("charts.essentials.actualMode")
        : t("charts.essentials.plannedMode"),
    };
  }, [colorScheme, overview.summary.essential_breakdown, t]);

  const areaChart = useMemo(() => {
    const expenseBlocks = overview.summary.comparison_blocks.filter(
      (
        block,
      ): block is BudgetComparisonBlock & {
        key: Exclude<BudgetComparisonBlock["key"], "income">;
      } => block.key !== "income",
    );
    const hasActualValues = expenseBlocks.some(
      (block) => block.actual_amount > 0,
    );
    const data = expenseBlocks
      .map((block) => ({
        color: getAreaColor(block.key, colorScheme),
        label: t(`comparisons.items.${block.key}`),
        value: hasActualValues ? block.actual_amount : block.planned_amount,
      }))
      .filter((item) => item.value > 0);

    return {
      data,
      modeLabel: hasActualValues
        ? t("charts.areas.actualMode")
        : t("charts.areas.plannedMode"),
    };
  }, [colorScheme, overview.summary.comparison_blocks, t]);

  return (
    <View className="gap-5">
      <QuickInsightsCard
        activeDebtCount={activeDebtCount}
        activeGoalCount={activeGoalCount}
        summary={overview.summary}
      />

      <DonutChartCard
        centerCaption={t("charts.essentials.centerLabel", {
          count: essentialChart.data.length,
        })}
        currencyCode={overview.summary.currency_code}
        data={essentialChart.data}
        emptyDescription={t("charts.essentials.emptyDescription")}
        emptyTitle={t("charts.essentials.emptyTitle")}
        modeLabel={essentialChart.modeLabel}
        subtitle={t("charts.essentials.subtitle")}
        title={t("charts.essentials.title")}
      />

      <EssentialBreakdownCard
        currencyCode={overview.summary.currency_code}
        items={overview.summary.essential_breakdown}
      />

      <DonutChartCard
        centerCaption={t("charts.areas.centerLabel", {
          count: areaChart.data.length,
        })}
        currencyCode={overview.summary.currency_code}
        data={areaChart.data}
        emptyDescription={t("charts.areas.emptyDescription")}
        emptyTitle={t("charts.areas.emptyTitle")}
        modeLabel={areaChart.modeLabel}
        subtitle={t("charts.areas.subtitle")}
        title={t("charts.areas.title")}
      />

      <View className="gap-1">
        <Text weight="bold" className="text-2xl tracking-tight text-foreground">
          {t("comparisons.title")}
        </Text>
        <Text variant="muted">{t("comparisons.subtitle")}</Text>
      </View>

      <View className="gap-3">
        <View className="flex-row gap-3">
          {overview.summary.comparison_blocks.slice(0, 2).map((block) => (
            <ComparisonMetricCard
              key={block.key}
              block={block}
              currencyCode={overview.summary.currency_code}
            />
          ))}
        </View>

        <View className="flex-row gap-3">
          {overview.summary.comparison_blocks.slice(2, 4).map((block) => (
            <ComparisonMetricCard
              key={block.key}
              block={block}
              currencyCode={overview.summary.currency_code}
            />
          ))}
        </View>

        {overview.summary.comparison_blocks[4] ? (
          <ComparisonMetricCard
            block={overview.summary.comparison_blocks[4]}
            currencyCode={overview.summary.currency_code}
          />
        ) : null}
      </View>
    </View>
  );
}
