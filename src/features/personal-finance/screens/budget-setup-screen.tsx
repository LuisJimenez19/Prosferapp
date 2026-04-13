import { useIsFocused } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { BudgetPlannedActionsSection } from "@/src/features/personal-finance/components/budgets/budget-planned-actions-section";
import { BudgetSetupForm } from "@/src/features/personal-finance/components/budget-setup/budget-setup-form";
import { BudgetSetupTabs } from "@/src/features/personal-finance/components/budget-setup/budget-setup-tabs";
import { useBudgetSetup } from "@/src/features/personal-finance/hooks/use-budget-setup";
import type { BudgetSetupPersistScope } from "@/src/features/personal-finance/types/budget-setup";
import { Card, CardContent, Screen, Text } from "@/src/components/ui";
import CreateTransactionModalScreen from "@/src/features/personal-finance/screens/create-transaction-modal-screen";
import { getThemeColors } from "@/src/lib/theme";

type BudgetHubTabId = "plan" | "guided" | "manual";

function resolveBudgetHubTab(input: string | string[] | undefined): BudgetHubTabId {
  const value = Array.isArray(input) ? input[0] : input;

  if (value === "guided" || value === "manual" || value === "plan") {
    return value;
  }

  return "plan";
}

export default function BudgetSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: BudgetHubTabId }>();
  const { t } = useTranslation("budget");
  const colors = getThemeColors(useColorScheme());
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<BudgetHubTabId>(
    resolveBudgetHubTab(params.tab),
  );
  const [movementsRefreshKey, setMovementsRefreshKey] = useState(0);
  const {
    actions,
    currencyCode,
    debtDrafts,
    error,
    expenseDrafts,
    goalDrafts,
    hasExistingPlan,
    incomeDrafts,
    isLoading,
    isSaving,
    monthKey,
    preferences,
    savePlan,
    wallets,
  } = useBudgetSetup(isFocused && activeTab === "plan");

  useEffect(() => {
    setActiveTab(resolveBudgetHubTab(params.tab));
  }, [params.tab]);

  const topTabs = useMemo(
    () => [
      { id: "plan" as const, label: t("screen.topTabs.plan") },
      { id: "guided" as const, label: t("screen.topTabs.guided") },
      { id: "manual" as const, label: t("screen.topTabs.manual") },
    ],
    [t],
  );

  const activeSubtitle = (() => {
    switch (activeTab) {
      case "guided":
        return t("screen.topTabDescriptions.guided");
      case "manual":
        return t("screen.topTabDescriptions.manual");
      case "plan":
      default:
        return t("screen.subtitle");
    }
  })();

  function handleChangeTab(nextTab: BudgetHubTabId) {
    setActiveTab(nextTab);
    router.setParams({ tab: nextTab });
  }

  async function handleSubmit() {
    try {
      await savePlan("all");
      setMovementsRefreshKey((currentValue) => currentValue + 1);
      handleChangeTab("guided");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("errors.saveTitle");
      Alert.alert(t("errors.saveTitle"), message);
      throw submitError;
    }
  }

  async function handleSaveSection(sectionId: BudgetSetupPersistScope) {
    try {
      await savePlan(sectionId);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("errors.saveTitle");
      Alert.alert(t("errors.saveTitle"), message);
      throw submitError;
    }
  }

  return (
    <Screen
      scroll
      keyboardShouldPersistTaps="handled"
      contentClassName="gap-5 pb-16"
    >
      <Stack.Screen options={{ title: t("screen.title") }} />

      <View className="gap-2">
        <Text variant="title">{t("screen.title")}</Text>
        <Text variant="muted">{activeSubtitle}</Text>
      </View>

      <BudgetSetupTabs
        activeSection={activeTab}
        onChangeSection={handleChangeTab}
        tabs={topTabs}
      />

      {activeTab === "plan" ? (
        <>
          {isLoading ? (
            <Card>
              <CardContent className="items-center gap-3 py-8">
                <ActivityIndicator color={colors.primary} size="small" />
                <Text variant="muted">{t("loading")}</Text>
              </CardContent>
            </Card>
          ) : null}

          {error ? (
            <Card className="border-destructive/30 bg-destructive/10">
              <CardContent className="gap-2">
                <Text weight="semibold" className="text-destructive">
                  {t("errors.title")}
                </Text>
                <Text variant="muted" className="text-destructive/80">
                  {error}
                </Text>
              </CardContent>
            </Card>
          ) : null}

          {!isLoading ? (
            <BudgetSetupForm
              actions={actions}
              currencyCode={currencyCode}
              debtDrafts={debtDrafts}
              expenseDrafts={expenseDrafts}
              goalDrafts={goalDrafts}
              hasExistingPlan={hasExistingPlan}
              incomeDrafts={incomeDrafts}
              isSaving={isSaving}
              monthKey={monthKey}
              onSaveSection={(sectionId) => handleSaveSection(sectionId)}
              onSubmit={() => {
                handleSubmit().catch(() => {
                  // Submission errors are handled inside handleSubmit.
                });
              }}
              preferences={preferences}
              wallets={wallets}
            />
          ) : null}
        </>
      ) : null}

      {activeTab === "guided" ? (
        <BudgetPlannedActionsSection
          isFocused={isFocused}
          onGoToPlan={() => handleChangeTab("plan")}
          refreshKey={movementsRefreshKey}
        />
      ) : null}

      {activeTab === "manual" ? (
        <View className="gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="gap-2 py-4">
              <Text weight="semibold" className="text-primary">
                {t("screen.manualTitle")}
              </Text>
              <Text variant="muted">{t("screen.manualDescription")}</Text>
            </CardContent>
          </Card>

          <CreateTransactionModalScreen
            embedded
            onSaved={() => {
              setMovementsRefreshKey((currentValue) => currentValue + 1);
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
