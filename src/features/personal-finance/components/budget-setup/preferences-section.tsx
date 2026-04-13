import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Card, CardContent, Input, Label, Text } from "@/src/components/ui";
import type { BudgetPreferences, BudgetStrategyType } from "@/src/features/personal-finance/types/budget";
import { LabelWithHelp } from "./label-with-help";
import { SectionHeader } from "./section-header";
import { StrategyButton } from "./strategy-button";

type PreferencesSectionProps = {
  onSetAllowFlexibleSpending: (value: boolean) => void;
  onSetBufferMode: (value: BudgetPreferences["buffer_mode"]) => void;
  onSetBufferValue: (value: string) => void;
  onSetPrioritizeDebtOverGoals: (value: boolean) => void;
  onSetStrategyType: (value: BudgetStrategyType) => void;
  preferences: BudgetPreferences;
};

export function PreferencesSection({
  onSetAllowFlexibleSpending,
  onSetBufferMode,
  onSetBufferValue,
  onSetPrioritizeDebtOverGoals,
  onSetStrategyType,
  preferences,
}: PreferencesSectionProps) {
  const { t } = useTranslation("budget");
  const closeLabel = t("sections.preferences.yes");
  const bufferValueHelpDescription =
    preferences.buffer_mode === "percentage"
      ? t("sections.preferences.bufferValueHelpDescriptionPercentage")
      : t("sections.preferences.bufferValueHelpDescriptionFixedAmount");
  const bufferValueModeDescription =
    preferences.buffer_mode === "percentage"
      ? t("sections.preferences.bufferValueModeDescriptionPercentage")
      : t("sections.preferences.bufferValueModeDescriptionFixedAmount");

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <SectionHeader
          closeLabel={closeLabel}
          description={t("sections.preferences.description")}
          title={t("sections.preferences.title")}
        />

        <View className="gap-2">
          <LabelWithHelp
            closeLabel={closeLabel}
            label={t("sections.preferences.strategyLabel")}
            tooltipDescription={t("sections.preferences.strategyHelpDescription")}
            tooltipTitle={t("sections.preferences.strategyHelpTitle")}
          />
          <View className="flex-row flex-wrap gap-3">
            {(
              [
                ["priority-based", t("sections.preferences.strategy.priorityBased")],
                ["zero-based", t("sections.preferences.strategy.zeroBased")],
                ["income-first", t("sections.preferences.strategy.incomeFirst")],
              ] as const
            ).map(([value, label]) => (
              <StrategyButton
                key={value}
                isSelected={preferences.strategy_type === value}
                label={label}
                onPress={() => onSetStrategyType(value)}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <LabelWithHelp
            closeLabel={closeLabel}
            label={t("sections.preferences.bufferModeLabel")}
            tooltipDescription={t("sections.preferences.bufferModeHelpDescription")}
            tooltipTitle={t("sections.preferences.bufferModeHelpTitle")}
          />
          <View className="flex-row flex-wrap gap-3">
            <StrategyButton
              isSelected={preferences.buffer_mode === "percentage"}
              label={t("sections.preferences.bufferMode.percentage")}
              onPress={() => onSetBufferMode("percentage")}
            />
            <StrategyButton
              isSelected={preferences.buffer_mode === "fixed_amount"}
              label={t("sections.preferences.bufferMode.fixedAmount")}
              onPress={() => onSetBufferMode("fixed_amount")}
            />
          </View>
        </View>

        <View className="gap-2">
          <LabelWithHelp
            closeLabel={closeLabel}
            label={t("sections.preferences.bufferValueLabel")}
            tooltipDescription={bufferValueHelpDescription}
            tooltipTitle={t("sections.preferences.bufferValueHelpTitle")}
          />
          <Input
            value={String(preferences.buffer_value)}
            keyboardType="decimal-pad"
            onChangeText={onSetBufferValue}
          />
          <Text variant="muted">{bufferValueModeDescription}</Text>
        </View>

        <View className="gap-2">
          <Label>{t("sections.preferences.allowFlexibleLabel")}</Label>
          <View className="flex-row gap-3">
            <StrategyButton
              isSelected={preferences.allow_flexible_spending}
              label={t("sections.preferences.yes")}
              onPress={() => onSetAllowFlexibleSpending(true)}
            />
            <StrategyButton
              isSelected={!preferences.allow_flexible_spending}
              label={t("sections.preferences.no")}
              onPress={() => onSetAllowFlexibleSpending(false)}
            />
          </View>
        </View>

        <View className="gap-2">
          <LabelWithHelp
            closeLabel={closeLabel}
            label={t("sections.preferences.prioritizeDebtLabel")}
            tooltipDescription={t("sections.preferences.prioritizeDebtHelpDescription")}
            tooltipTitle={t("sections.preferences.prioritizeDebtHelpTitle")}
          />
          <View className="flex-row gap-3">
            <StrategyButton
              isSelected={preferences.prioritize_debt_over_goals}
              label={t("sections.preferences.yes")}
              onPress={() => onSetPrioritizeDebtOverGoals(true)}
            />
            <StrategyButton
              isSelected={!preferences.prioritize_debt_over_goals}
              label={t("sections.preferences.no")}
              onPress={() => onSetPrioritizeDebtOverGoals(false)}
            />
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
