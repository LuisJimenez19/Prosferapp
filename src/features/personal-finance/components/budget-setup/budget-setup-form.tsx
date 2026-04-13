import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Card, CardContent, Text } from "@/src/components/ui";
import type { BudgetSetupActions } from "@/src/features/personal-finance/hooks/use-budget-setup";
import {
  budgetSetupSummaryService,
} from "@/src/features/personal-finance/services/budget-setup-summary.service";
import type {
  DebtDraft,
  ExpenseDraft,
  GoalDraft,
  IncomeDraft,
} from "@/src/features/personal-finance/services/budget-setup-form";
import type {
  BudgetSetupPersistScope,
  BudgetSetupSectionId,
} from "@/src/features/personal-finance/types/budget-setup";
import type { BudgetPreferences } from "@/src/features/personal-finance/types/budget";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { BudgetSetupSummarySection } from "./budget-setup-summary-section";
import { BudgetSetupTabs } from "./budget-setup-tabs";
import { DebtsSection } from "./debts-section";
import { EssentialsSection } from "./essentials-section";
import { GoalsSection } from "./goals-section";
import { IncomeSection } from "./income-section";
import { PreferencesSection } from "./preferences-section";

type BudgetSetupFormProps = {
  actions: BudgetSetupActions;
  currencyCode: string;
  debtDrafts: DebtDraft[];
  expenseDrafts: ExpenseDraft[];
  goalDrafts: GoalDraft[];
  hasExistingPlan: boolean;
  incomeDrafts: IncomeDraft[];
  isSaving: boolean;
  monthKey: string;
  onSaveSection: (sectionId: BudgetSetupPersistScope) => Promise<void>;
  onSubmit: () => void;
  preferences: BudgetPreferences;
  wallets: Wallet[];
};

export function BudgetSetupForm({
  actions,
  currencyCode,
  debtDrafts,
  expenseDrafts,
  goalDrafts,
  hasExistingPlan,
  incomeDrafts,
  isSaving,
  monthKey,
  onSaveSection,
  onSubmit,
  preferences,
  wallets,
}: BudgetSetupFormProps) {
  const { t } = useTranslation("budget");
  const [activeSection, setActiveSection] =
    useState<BudgetSetupSectionId>("income");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const overview = useMemo(
    () =>
      budgetSetupSummaryService.buildBudgetSetupOverview({
        debtDrafts,
        expenseDrafts,
        goalDrafts,
        incomeDrafts,
        monthKey,
        preferences,
      }),
    [debtDrafts, expenseDrafts, goalDrafts, incomeDrafts, monthKey, preferences],
  );
  const tabs = useMemo(
    () => [
      {
        badge: incomeDrafts.length > 0 ? String(incomeDrafts.length) : null,
        id: "income" as const,
        label: t("screen.tabs.income"),
      },
      {
        badge: expenseDrafts.length > 0 ? String(expenseDrafts.length) : null,
        id: "essentials" as const,
        label: t("screen.tabs.essentials"),
      },
      {
        badge: debtDrafts.length > 0 ? String(debtDrafts.length) : null,
        id: "debts" as const,
        label: t("screen.tabs.debts"),
      },
      {
        badge: goalDrafts.length > 0 ? String(goalDrafts.length) : null,
        id: "goals" as const,
        label: t("screen.tabs.goals"),
      },
      {
        badge: null,
        id: "preferences" as const,
        label: t("screen.tabs.preferences"),
      },
      {
        badge: null,
        id: "summary" as const,
        label: t("screen.tabs.summary"),
      },
    ],
    [debtDrafts.length, expenseDrafts.length, goalDrafts.length, incomeDrafts.length, t],
  );

  function handleChangeSection(sectionId: BudgetSetupSectionId) {
    setActiveSection(sectionId);
    setSaveFeedback(null);
  }

  async function handleSaveSection(sectionId: BudgetSetupPersistScope) {
    await onSaveSection(sectionId);
    setSaveFeedback(t(`screen.sectionSaved.${sectionId}`));
  }

  const activeSectionContent = (() => {
    switch (activeSection) {
      case "income":
        return (
          <IncomeSection
            incomeDrafts={incomeDrafts}
            monthKey={monthKey}
            wallets={wallets}
            onAddIncomeDraft={actions.addIncomeDraft}
            onRemoveIncomeDraft={actions.removeIncomeDraft}
            onSetPrimaryIncome={actions.setPrimaryIncome}
            onUpdateIncomeDraft={actions.updateIncomeDraft}
          />
        );
      case "essentials":
        return (
          <EssentialsSection
            expenseDrafts={expenseDrafts}
            onCreateEssentialCategory={actions.createEssentialCategory}
            onRemoveEssentialCategory={actions.removeEssentialCategory}
            onRenameEssentialCategory={actions.renameEssentialCategory}
            onUpdateExpenseDraft={actions.updateExpenseDraft}
          />
        );
      case "debts":
        return (
          <DebtsSection
            currencyCode={currencyCode}
            debtDrafts={debtDrafts}
            monthKey={monthKey}
            onAddDebtDraft={actions.addDebtDraft}
            onRemoveDebtDraft={actions.removeDebtDraft}
            onUpdateDebtDraft={actions.updateDebtDraft}
          />
        );
      case "goals":
        return (
          <GoalsSection
            currencyCode={currencyCode}
            goalPlanningCapacity={overview.goalPlanningCapacity}
            goalDrafts={goalDrafts}
            onAddGoalDraft={actions.addGoalDraft}
            onRemoveGoalDraft={actions.removeGoalDraft}
            onUpdateGoalDraft={actions.updateGoalDraft}
          />
        );
      case "preferences":
        return (
          <PreferencesSection
            onSetAllowFlexibleSpending={actions.setAllowFlexibleSpending}
            onSetBufferMode={actions.setBufferMode}
            onSetBufferValue={actions.setBufferValue}
            onSetPrioritizeDebtOverGoals={actions.setPrioritizeDebtOverGoals}
            onSetStrategyType={actions.setStrategyType}
            preferences={preferences}
          />
        );
      case "summary":
        return (
          <BudgetSetupSummarySection
            currencyCode={currencyCode}
            overview={overview}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <View className="gap-4">
      <BudgetSetupTabs
        activeSection={activeSection}
        onChangeSection={handleChangeSection}
        tabs={tabs}
      />

      {activeSection !== "summary" && hasExistingPlan ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="gap-2 py-4">
            <Text weight="semibold" className="text-primary">
              {t("screen.partialSaveTitle")}
            </Text>
            <Text variant="muted">
              {t("screen.partialSaveDescription", {
                section: t(`screen.tabs.${activeSection}`),
              })}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      {activeSection !== "summary" && !hasExistingPlan ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="gap-2 py-4">
            <Text weight="semibold" className="text-primary">
              {t("screen.firstPlanTitle")}
            </Text>
            <Text variant="muted">{t("screen.firstPlanDescription")}</Text>
          </CardContent>
        </Card>
      ) : null}

      {saveFeedback && hasExistingPlan ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="gap-2 py-4">
            <Text weight="semibold" className="text-primary">
              {t("screen.sectionSavedTitle")}
            </Text>
            <Text variant="muted">{saveFeedback}</Text>
          </CardContent>
        </Card>
      ) : null}

      {activeSectionContent}

      {activeSection === "summary" ? (
        <Button fullWidth loading={isSaving} onPress={onSubmit}>
          {hasExistingPlan
            ? t("screen.updateAction")
            : t("screen.generateAction")}
        </Button>
      ) : (
        <View className="gap-3">
          {hasExistingPlan ? (
            <Button
              fullWidth
              loading={isSaving}
              onPress={() => {
                handleSaveSection(activeSection as BudgetSetupPersistScope).catch(() => {
                  // Save errors are surfaced by the screen-level error card.
                });
              }}
            >
              {t(`screen.sectionActions.${activeSection}`)}
            </Button>
          ) : null}
          <Button
            fullWidth
            variant={hasExistingPlan ? "outline" : "default"}
            onPress={() => handleChangeSection("summary")}
          >
            {t("screen.summaryAction")}
          </Button>
        </View>
      )}
    </View>
  );
}
