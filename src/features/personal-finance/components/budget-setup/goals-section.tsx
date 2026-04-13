import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Card, CardContent, DatePickerField, Input, Text } from "@/src/components/ui";
import {
  addMonthsToDate,
  estimateGoalCompletionMonths,
  projectGoalFutureValue,
  resolveEffectiveGoalAnnualYieldRate,
} from "@/src/features/personal-finance/services/planning-insights";
import type { GoalDraft } from "@/src/features/personal-finance/services/budget-setup-form";
import { dateInputValueToDate, formatDateLabel, toDateInputValue } from "@/src/lib/dates";
import { formatCurrency, parseMoneyInput } from "@/src/lib/money";
import { LabelWithHelp } from "./label-with-help";
import { SectionHeader } from "./section-header";
import { StrategyButton } from "./strategy-button";

type GoalsSectionProps = {
  currencyCode: string;
  goalPlanningCapacity: number;
  goalDrafts: GoalDraft[];
  onAddGoalDraft: () => void;
  onRemoveGoalDraft: (clientId: string) => void;
  onUpdateGoalDraft: (clientId: string, updates: Partial<GoalDraft>) => void;
};

function resolveGoalTargetDate(value: string) {
  if (!value.trim()) {
    return null;
  }

  try {
    return dateInputValueToDate(value);
  } catch {
    return null;
  }
}

function readOptionalAmount(value: string) {
  try {
    return parseMoneyInput(value, {});
  } catch {
    return 0;
  }
}

function readOptionalRate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const normalizedValue = trimmedValue.replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

export function GoalsSection({
  currencyCode,
  goalPlanningCapacity,
  goalDrafts,
  onAddGoalDraft,
  onRemoveGoalDraft,
  onUpdateGoalDraft,
}: GoalsSectionProps) {
  const { t } = useTranslation(["budget", "common"]);
  const closeLabel = t("common:actions.confirm");
  const desiredGoalContributionTotal = goalDrafts.reduce(
    (sum, draft) => sum + readOptionalAmount(draft.target_monthly_contribution),
    0,
  );
  const isGoalBudgetTight =
    desiredGoalContributionTotal > 0 &&
    desiredGoalContributionTotal > goalPlanningCapacity;

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <SectionHeader
          closeLabel={closeLabel}
          description={t("budget:sections.goals.description")}
          title={t("budget:sections.goals.title")}
          tooltipDescription={t("budget:sections.goals.helpDescription")}
          tooltipTitle={t("budget:sections.goals.helpTitle")}
        />

        <View
          className={[
            "gap-1 rounded-lg border px-4 py-3",
            isGoalBudgetTight
              ? "border-destructive/30 bg-destructive/10"
              : "border-primary/20 bg-primary/5",
          ].join(" ")}
        >
          <Text
            weight="semibold"
            className={isGoalBudgetTight ? "text-destructive" : "text-primary"}
          >
            {isGoalBudgetTight
              ? t("budget:sections.goals.capacityWarningTitle")
              : t("budget:sections.goals.capacityOkTitle")}
          </Text>
          <Text variant="muted">
            {isGoalBudgetTight
              ? t("budget:sections.goals.capacityWarningDescription", {
                  desired: formatCurrency(
                    desiredGoalContributionTotal,
                    currencyCode,
                  ),
                  available: formatCurrency(goalPlanningCapacity, currencyCode),
                })
              : t("budget:sections.goals.capacityOkDescription", {
                  desired: formatCurrency(
                    desiredGoalContributionTotal,
                    currencyCode,
                  ),
                  available: formatCurrency(goalPlanningCapacity, currencyCode),
                })}
          </Text>
        </View>

        {goalDrafts.map((draft) => {
          const targetAmount = readOptionalAmount(draft.target_amount);
          const monthlyContribution = readOptionalAmount(
            draft.target_monthly_contribution,
          );
          const annualYieldRate = readOptionalRate(draft.annual_yield_rate);
          const effectiveAnnualYieldRate = resolveEffectiveGoalAnnualYieldRate(
            draft.savings_type,
            annualYieldRate,
          );
          const showsYieldRate = draft.savings_type !== "cash";
          const completionMonths = estimateGoalCompletionMonths({
            targetAmount,
            currentAmount: draft.current_amount,
            monthlyContribution,
            annualYieldRate: effectiveAnnualYieldRate,
          });
          const projectedCompletionDate =
            completionMonths !== null
              ? addMonthsToDate(new Date(), completionMonths)
              : null;
          const projectedTwelveMonthAmount = projectGoalFutureValue({
            currentAmount: draft.current_amount,
            monthlyContribution,
            annualYieldRate: effectiveAnnualYieldRate,
            months: 12,
          });
          const missesTargetDate =
            Boolean(draft.target_date) &&
            projectedCompletionDate !== null &&
            draft.target_date < toDateInputValue(projectedCompletionDate);

          return (
            <View
              key={draft.client_id}
              className="gap-3 rounded-lg bg-secondary px-4 py-4"
            >
              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.goals.nameLabel")}
                />
                <Input
                  value={draft.name}
                  onChangeText={(value) =>
                    onUpdateGoalDraft(draft.client_id, { name: value })
                  }
                />
              </View>

              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.goals.descriptionLabel")}
                  tooltipDescription={t(
                    "budget:sections.goals.descriptionHelpDescription",
                  )}
                  tooltipTitle={t("budget:sections.goals.descriptionHelpTitle")}
                />
                <Input
                  value={draft.description}
                  onChangeText={(value) =>
                    onUpdateGoalDraft(draft.client_id, { description: value })
                  }
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-2">
                  <LabelWithHelp
                    closeLabel={closeLabel}
                    label={t("budget:sections.goals.targetLabel")}
                    tooltipDescription={t("budget:sections.goals.targetHelpDescription")}
                    tooltipTitle={t("budget:sections.goals.targetHelpTitle")}
                  />
                  <Input
                    value={draft.target_amount}
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      onUpdateGoalDraft(draft.client_id, {
                        target_amount: value,
                      })
                    }
                  />
                </View>

                <View className="flex-1 gap-2">
                  <LabelWithHelp
                    closeLabel={closeLabel}
                    label={t("budget:sections.goals.monthlyContributionLabel")}
                    tooltipDescription={t(
                      "budget:sections.goals.monthlyContributionHelpDescription",
                    )}
                    tooltipTitle={t(
                      "budget:sections.goals.monthlyContributionHelpTitle",
                    )}
                  />
                  <Input
                    value={draft.target_monthly_contribution}
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      onUpdateGoalDraft(draft.client_id, {
                        target_monthly_contribution: value,
                      })
                    }
                  />
                </View>
              </View>

              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.goals.savingsTypeLabel")}
                  tooltipDescription={t(
                    "budget:sections.goals.savingsTypeHelpDescription",
                  )}
                  tooltipTitle={t("budget:sections.goals.savingsTypeHelpTitle")}
                />
                <View className="flex-row flex-wrap gap-3">
                  {(
                    [
                      ["cash", t("budget:sections.goals.savingsType.cash")],
                      [
                        "yield_account",
                        t("budget:sections.goals.savingsType.yieldAccount"),
                      ],
                      [
                        "investment",
                        t("budget:sections.goals.savingsType.investment"),
                      ],
                    ] as const
                  ).map(([value, label]) => (
                    <StrategyButton
                      key={value}
                      isSelected={draft.savings_type === value}
                      label={label}
                      onPress={() =>
                        onUpdateGoalDraft(draft.client_id, {
                          savings_type: value,
                        })
                      }
                    />
                  ))}
                </View>
              </View>

              {showsYieldRate ? (
                <View className="gap-2">
                  <LabelWithHelp
                    closeLabel={closeLabel}
                    label={t("budget:sections.goals.annualYieldRateLabel")}
                    tooltipDescription={t(
                      "budget:sections.goals.annualYieldRateHelpDescription",
                    )}
                    tooltipTitle={t(
                      "budget:sections.goals.annualYieldRateHelpTitle",
                    )}
                  />
                  <Input
                    value={draft.annual_yield_rate}
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      onUpdateGoalDraft(draft.client_id, {
                        annual_yield_rate: value,
                      })
                    }
                  />
                  <Text variant="muted">
                    {draft.savings_type === "investment"
                      ? t("budget:sections.goals.annualYieldRateInvestmentHint")
                      : t("budget:sections.goals.annualYieldRateHint")}
                  </Text>
                </View>
              ) : (
                <View className="rounded-lg border border-border/30 bg-card px-4 py-3">
                  <Text variant="muted">
                    {t("budget:sections.goals.cashModeHint")}
                  </Text>
                </View>
              )}

              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.goals.targetDateLabel")}
                />
                <DatePickerField
                  cancelLabel={t("common:actions.cancel")}
                  confirmLabel={closeLabel}
                  dialogTitle={t("budget:sections.goals.targetDateLabel")}
                  displayValue={
                    draft.target_date
                      ? formatDateLabel(draft.target_date)
                      : t("budget:sections.goals.targetDatePlaceholder")
                  }
                  minimumDate={new Date()}
                  onChange={(value) =>
                    onUpdateGoalDraft(draft.client_id, {
                      target_date: toDateInputValue(value),
                    })
                  }
                  placeholder={t("budget:sections.goals.targetDatePlaceholder")}
                  value={resolveGoalTargetDate(draft.target_date)}
                />
                {draft.target_date ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="self-start rounded-xxs"
                    onPress={() =>
                      onUpdateGoalDraft(draft.client_id, { target_date: "" })
                    }
                  >
                    {t("budget:sections.goals.clearTargetDateAction")}
                  </Button>
                ) : null}
              </View>

              {(targetAmount > 0 || monthlyContribution > 0) && (
                <View className="gap-1 rounded-lg border border-border/30 bg-card px-4 py-3">
                  <Text weight="semibold">
                    {t("budget:sections.goals.projectionTitle")}
                  </Text>
                  <Text variant="muted">
                    {draft.current_amount > 0
                      ? t("budget:sections.goals.currentAmountSummary", {
                          amount: formatCurrency(draft.current_amount, currencyCode),
                        })
                      : t("budget:sections.goals.monthlyContributionSummary", {
                          amount: formatCurrency(monthlyContribution, currencyCode),
                        })}
                  </Text>
                  <Text variant="muted">
                    {draft.savings_type === "cash"
                      ? t("budget:sections.goals.projectionModeCash")
                      : t("budget:sections.goals.projectionModeRate", {
                          rate: effectiveAnnualYieldRate,
                          type: t(
                            `budget:sections.goals.savingsType.${
                              draft.savings_type === "yield_account"
                                ? "yieldAccount"
                                : "investment"
                            }`,
                          ),
                        })}
                  </Text>
                  <Text variant="muted">
                    {t("budget:sections.goals.twelveMonthProjection", {
                      amount: formatCurrency(projectedTwelveMonthAmount, currencyCode),
                    })}
                  </Text>
                  {completionMonths !== null && projectedCompletionDate ? (
                    <Text
                      variant="muted"
                      className={missesTargetDate ? "text-destructive" : undefined}
                    >
                      {draft.target_date
                        ? missesTargetDate
                          ? t("budget:sections.goals.targetDateWarning", {
                              date: formatDateLabel(
                                toDateInputValue(projectedCompletionDate),
                              ),
                            })
                          : t("budget:sections.goals.targetDateOk", {
                              date: formatDateLabel(
                                toDateInputValue(projectedCompletionDate),
                              ),
                            })
                        : t("budget:sections.goals.completionEstimate", {
                            months: completionMonths,
                            date: formatDateLabel(
                              toDateInputValue(projectedCompletionDate),
                            ),
                          })}
                    </Text>
                  ) : null}
                </View>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="self-start rounded-xxs"
                onPress={() => onRemoveGoalDraft(draft.client_id)}
              >
                {t("budget:sections.goals.removeAction")}
              </Button>
            </View>
          );
        })}

        <Button variant="outline" onPress={onAddGoalDraft}>
          {t("budget:sections.goals.addAction")}
        </Button>
      </CardContent>
    </Card>
  );
}
