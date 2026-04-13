import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  DatePickerField,
  Input,
  Text,
} from "@/src/components/ui";
import {
  dateToDayValue,
  formatDayLabel,
  getPickerDateForDay,
  type DebtDraft,
} from "@/src/features/personal-finance/services/budget-setup-form";
import {
  getDebtTimeline,
} from "@/src/features/personal-finance/services/planning-insights";
import {
  dateInputValueToDate,
  formatDateLabel,
  toDateInputValue,
} from "@/src/lib/dates";
import { formatCurrency, parseMoneyInput } from "@/src/lib/money";
import { LabelWithHelp } from "./label-with-help";
import { SectionHeader } from "./section-header";

type DebtsSectionProps = {
  currencyCode: string;
  debtDrafts: DebtDraft[];
  monthKey: string;
  onAddDebtDraft: () => void;
  onRemoveDebtDraft: (clientId: string) => void;
  onUpdateDebtDraft: (clientId: string, updates: Partial<DebtDraft>) => void;
};

function resolveOptionalDate(value: string) {
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

function readOptionalInteger(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

export function DebtsSection({
  currencyCode,
  debtDrafts,
  monthKey,
  onAddDebtDraft,
  onRemoveDebtDraft,
  onUpdateDebtDraft,
}: DebtsSectionProps) {
  const { t } = useTranslation(["budget", "common"]);
  const closeLabel = t("common:actions.confirm");

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <SectionHeader
          closeLabel={closeLabel}
          description={t("budget:sections.debts.description")}
          title={t("budget:sections.debts.title")}
          tooltipDescription={t("budget:sections.debts.helpDescription")}
          tooltipTitle={t("budget:sections.debts.helpTitle")}
        />

        {debtDrafts.map((draft) => {
          const currentBalance = readOptionalAmount(draft.current_balance);
          const targetPayment = Math.max(
            readOptionalAmount(draft.target_payment),
            readOptionalAmount(draft.minimum_payment),
          );
          const totalInstallments = readOptionalInteger(
            draft.total_installments,
          );
          const installmentsPaid =
            readOptionalInteger(draft.installments_paid) ?? 0;
          const debtTimeline = getDebtTimeline({
            currentBalance,
            dueDay: draft.due_day ? Number(draft.due_day) : null,
            installmentsPaid,
            monthKey,
            monthlyPayment: targetPayment,
            startDate: draft.start_date,
            totalInstallments,
          });
          const completionReferenceDate =
            debtTimeline.scheduledCompletionDate ?? debtTimeline.projectedPayoffDate;
          const hasTargetMismatch =
            Boolean(draft.payoff_target_date) &&
            completionReferenceDate !== null &&
            draft.payoff_target_date < completionReferenceDate;

          return (
            <View
              key={draft.client_id}
              className="gap-3 rounded-lg bg-secondary px-4 py-4"
            >
              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.debts.nameLabel")}
                />
                <Input
                  value={draft.name}
                  onChangeText={(value) =>
                    onUpdateDebtDraft(draft.client_id, { name: value })
                  }
                />
              </View>

              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.debts.startDateLabel")}
                  tooltipDescription={t(
                    "budget:sections.debts.startDateHelpDescription",
                  )}
                  tooltipTitle={t("budget:sections.debts.startDateHelpTitle")}
                />
                <DatePickerField
                  cancelLabel={t("common:actions.cancel")}
                  confirmLabel={closeLabel}
                  dialogTitle={t("budget:sections.debts.startDateLabel")}
                  displayValue={
                    draft.start_date
                      ? formatDateLabel(draft.start_date)
                      : t("budget:sections.debts.startDatePlaceholder")
                  }
                  onChange={(value) =>
                    onUpdateDebtDraft(draft.client_id, {
                      start_date: toDateInputValue(value),
                    })
                  }
                  placeholder={t("budget:sections.debts.startDatePlaceholder")}
                  value={resolveOptionalDate(draft.start_date)}
                />
                {draft.start_date ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="self-start rounded-xxs"
                    onPress={() =>
                      onUpdateDebtDraft(draft.client_id, { start_date: "" })
                    }
                  >
                    {t("budget:sections.debts.clearStartDateAction")}
                  </Button>
                ) : null}
              </View>

              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.debts.balanceLabel")}
                  tooltipDescription={t(
                    "budget:sections.debts.balanceHelpDescription",
                  )}
                  tooltipTitle={t("budget:sections.debts.balanceHelpTitle")}
                />
                <Input
                  value={draft.current_balance}
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    onUpdateDebtDraft(draft.client_id, {
                      current_balance: value,
                    })
                  }
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-2">
                  <LabelWithHelp
                    closeLabel={closeLabel}
                    label={t("budget:sections.debts.minimumLabel")}
                  />
                  <Input
                    value={draft.minimum_payment}
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      onUpdateDebtDraft(draft.client_id, {
                        minimum_payment: value,
                      })
                    }
                  />
                </View>

                <View className="flex-1 gap-2">
                  <LabelWithHelp
                    closeLabel={closeLabel}
                    label={t("budget:sections.debts.targetLabel")}
                    tooltipDescription={t(
                      "budget:sections.debts.targetHelpDescription",
                    )}
                    tooltipTitle={t("budget:sections.debts.targetHelpTitle")}
                  />
                  <Input
                    value={draft.target_payment}
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      onUpdateDebtDraft(draft.client_id, {
                        target_payment: value,
                      })
                    }
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-2">
                  <LabelWithHelp
                    closeLabel={closeLabel}
                    label={t("budget:sections.debts.installmentsLabel")}
                    tooltipDescription={t(
                      "budget:sections.debts.installmentsHelpDescription",
                    )}
                    tooltipTitle={t(
                      "budget:sections.debts.installmentsHelpTitle",
                    )}
                  />
                  <Input
                    value={draft.total_installments}
                    keyboardType="number-pad"
                    onChangeText={(value) =>
                      onUpdateDebtDraft(draft.client_id, {
                        total_installments: value,
                      })
                    }
                  />
                </View>

                <View className="flex-1 gap-2">
                  <LabelWithHelp
                    closeLabel={closeLabel}
                    label={t("budget:sections.debts.installmentsPaidLabel")}
                  />
                  <Input
                    value={draft.installments_paid}
                    keyboardType="number-pad"
                    onChangeText={(value) =>
                      onUpdateDebtDraft(draft.client_id, {
                        installments_paid: value,
                      })
                    }
                  />
                </View>
              </View>

              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.debts.dueDayLabel")}
                />
                <DatePickerField
                  cancelLabel={t("common:actions.cancel")}
                  confirmLabel={closeLabel}
                  dialogTitle={t("budget:sections.debts.dueDayLabel")}
                  displayValue={
                    draft.due_day
                      ? formatDayLabel(draft.due_day)
                      : t("budget:sections.debts.dueDayPlaceholder")
                  }
                  onChange={(value) =>
                    onUpdateDebtDraft(draft.client_id, {
                      due_day: dateToDayValue(value),
                    })
                  }
                  placeholder={t("budget:sections.debts.dueDayPlaceholder")}
                  value={
                    draft.due_day
                      ? getPickerDateForDay(monthKey, draft.due_day)
                      : null
                  }
                />
                {draft.due_day ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="self-start rounded-xxs"
                    onPress={() =>
                      onUpdateDebtDraft(draft.client_id, { due_day: "" })
                    }
                  >
                    {t("budget:sections.debts.clearDueDayAction")}
                  </Button>
                ) : null}
              </View>

              <View className="gap-2">
                <LabelWithHelp
                  closeLabel={closeLabel}
                  label={t("budget:sections.debts.payoffTargetDateLabel")}
                  tooltipDescription={t(
                    "budget:sections.debts.payoffTargetDateHelpDescription",
                  )}
                  tooltipTitle={t(
                    "budget:sections.debts.payoffTargetDateHelpTitle",
                  )}
                />
                <DatePickerField
                  cancelLabel={t("common:actions.cancel")}
                  confirmLabel={closeLabel}
                  dialogTitle={t("budget:sections.debts.payoffTargetDateLabel")}
                  displayValue={
                    draft.payoff_target_date
                      ? formatDateLabel(draft.payoff_target_date)
                      : t("budget:sections.debts.payoffTargetDatePlaceholder")
                  }
                  minimumDate={new Date()}
                  onChange={(value) =>
                    onUpdateDebtDraft(draft.client_id, {
                      payoff_target_date: toDateInputValue(value),
                    })
                  }
                  placeholder={t(
                    "budget:sections.debts.payoffTargetDatePlaceholder",
                  )}
                  value={resolveOptionalDate(draft.payoff_target_date)}
                />
                {draft.payoff_target_date ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="self-start rounded-xxs"
                    onPress={() =>
                      onUpdateDebtDraft(draft.client_id, {
                        payoff_target_date: "",
                      })
                    }
                  >
                    {t("budget:sections.debts.clearPayoffTargetDateAction")}
                  </Button>
                ) : null}
              </View>

              {currentBalance > 0 ||
              debtTimeline.remainingInstallments !== null ||
              debtTimeline.firstInstallmentDate ? (
                <View className="gap-1 rounded-lg border border-border/30 bg-card px-4 py-3">
                  <Text weight="semibold">
                    {t("budget:sections.debts.projectionTitle")}
                  </Text>
                  {!debtTimeline.isActiveThisMonth && debtTimeline.firstInstallmentDate ? (
                    <Text variant="muted" className="text-primary">
                      {t("budget:sections.debts.futureMonthNotice", {
                        date: formatDateLabel(debtTimeline.firstInstallmentDate),
                      })}
                    </Text>
                  ) : null}
                  <Text variant="muted">
                    {debtTimeline.remainingInstallments !== null
                      ? t("budget:sections.debts.remainingInstallments", {
                          count: debtTimeline.remainingInstallments,
                          total: totalInstallments,
                        })
                      : t("budget:sections.debts.targetPaymentSummary", {
                          amount: formatCurrency(targetPayment, currencyCode),
                        })}
                  </Text>
                  {debtTimeline.nextInstallmentDate ? (
                    <Text variant="muted">
                      {t("budget:sections.debts.nextInstallmentDate", {
                        date: formatDateLabel(debtTimeline.nextInstallmentDate),
                      })}
                    </Text>
                  ) : null}
                  {debtTimeline.scheduledCompletionDate ? (
                    <Text variant="muted">
                      {t("budget:sections.debts.scheduledCompletionDate", {
                        date: formatDateLabel(debtTimeline.scheduledCompletionDate),
                      })}
                    </Text>
                  ) : null}
                  {debtTimeline.payoffMonths !== null &&
                  debtTimeline.projectedPayoffDate ? (
                    <Text
                      variant="muted"
                      className={
                        hasTargetMismatch ? "text-destructive" : undefined
                      }
                    >
                      {hasTargetMismatch
                        ? t("budget:sections.debts.payoffDateWarning", {
                            date: formatDateLabel(debtTimeline.projectedPayoffDate),
                          })
                        : t("budget:sections.debts.payoffDateEstimate", {
                            months: debtTimeline.payoffMonths,
                            date: formatDateLabel(debtTimeline.projectedPayoffDate),
                          })}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Button
                size="sm"
                variant="ghost"
                className="self-start rounded-xxs"
                onPress={() => onRemoveDebtDraft(draft.client_id)}
              >
                {t("budget:sections.debts.removeAction")}
              </Button>
            </View>
          );
        })}

        <Button variant="outline" onPress={onAddDebtDraft}>
          {t("budget:sections.debts.addAction")}
        </Button>
      </CardContent>
    </Card>
  );
}
