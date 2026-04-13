import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  DatePickerField,
  Input,
  Label,
} from "@/src/components/ui";
import {
  dateToDayValue,
  formatDayLabel,
  getPickerDateForDay,
  type IncomeDraft,
} from "@/src/features/personal-finance/services/budget-setup-form";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { LabelWithHelp } from "./label-with-help";
import { SectionHeader } from "./section-header";
import { StrategyButton } from "./strategy-button";

type IncomeSectionProps = {
  incomeDrafts: IncomeDraft[];
  monthKey: string;
  onAddIncomeDraft: () => void;
  onRemoveIncomeDraft: (clientId: string) => void;
  onSetPrimaryIncome: (clientId: string) => void;
  onUpdateIncomeDraft: (
    clientId: string,
    updates: Partial<IncomeDraft>,
  ) => void;
  wallets: Wallet[];
};

export function IncomeSection({
  incomeDrafts,
  monthKey,
  onAddIncomeDraft,
  onRemoveIncomeDraft,
  onSetPrimaryIncome,
  onUpdateIncomeDraft,
  wallets,
}: IncomeSectionProps) {
  const { t } = useTranslation(["budget", "common"]);
  const closeLabel = t("common:actions.confirm");

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <SectionHeader
          closeLabel={closeLabel}
          description={t("budget:sections.income.description")}
          title={t("budget:sections.income.title")}
        />

        {incomeDrafts.map((draft) => (
          <View
            key={draft.client_id}
            className="gap-3 rounded-lg bg-secondary px-4 py-4"
          >
            <View className="gap-2">
              <Label>{t("budget:sections.income.nameLabel")}</Label>
              <Input
                value={draft.name}
                onChangeText={(value) =>
                  onUpdateIncomeDraft(draft.client_id, { name: value })
                }
              />
            </View>

            <View className="gap-2">
              <Label>{t("budget:sections.income.amountLabel")}</Label>
              <Input
                value={draft.amount}
                keyboardType="decimal-pad"
                onChangeText={(value) =>
                  onUpdateIncomeDraft(draft.client_id, { amount: value })
                }
              />
            </View>

            <View className="gap-2">
              <Label>{t("budget:sections.income.dayLabel")}</Label>
              <DatePickerField
                cancelLabel={t("common:actions.cancel")}
                confirmLabel={t("common:actions.confirm")}
                dialogTitle={t("budget:sections.income.dayLabel")}
                displayValue={
                  draft.expected_day
                    ? formatDayLabel(draft.expected_day)
                    : t("budget:sections.income.dayPlaceholder")
                }
                onChange={(value) =>
                  onUpdateIncomeDraft(draft.client_id, {
                    expected_day: dateToDayValue(value),
                  })
                }
                placeholder={t("budget:sections.income.dayPlaceholder")}
                value={
                  draft.expected_day
                    ? getPickerDateForDay(monthKey, draft.expected_day)
                    : null
                }
              />
              {draft.expected_day ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="self-start rounded-xxs"
                  onPress={() =>
                    onUpdateIncomeDraft(draft.client_id, { expected_day: "" })
                  }
                >
                  {t("budget:sections.income.clearDayAction")}
                </Button>
              ) : null}
            </View>

            {wallets.length > 0 ? (
              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.income.walletLabel")}
                  tooltipDescription={t(
                    "budget:sections.income.walletHelpDescription",
                  )}
                  tooltipTitle={t("budget:sections.income.walletHelpTitle")}
                />
                <View className="flex-row flex-wrap gap-3">
                  {wallets.map((wallet) => (
                    <StrategyButton
                      key={wallet.local_id}
                      isSelected={
                        draft.destination_wallet_local_id === wallet.local_id
                      }
                      label={wallet.name}
                      onPress={() =>
                        onUpdateIncomeDraft(draft.client_id, {
                          destination_wallet_local_id: wallet.local_id,
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View className="flex-row flex-wrap gap-3">
              <StrategyButton
                isSelected={draft.is_primary}
                label={t("budget:sections.income.primaryAction")}
                onPress={() => onSetPrimaryIncome(draft.client_id)}
              />
              {incomeDrafts.length > 1 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xxs"
                  onPress={() => onRemoveIncomeDraft(draft.client_id)}
                >
                  {t("budget:sections.income.removeAction")}
                </Button>
              ) : null}
            </View>
          </View>
        ))}

        <Button variant="outline" onPress={onAddIncomeDraft}>
          {t("budget:sections.income.addAction")}
        </Button>
      </CardContent>
    </Card>
  );
}
