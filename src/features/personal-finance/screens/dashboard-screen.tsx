import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button, Card, CardContent, EmptyState, Screen, Text } from "@/src/components/ui";
import { DashboardBudgetInsights } from "@/src/features/personal-finance/components/dashboard/dashboard-budget-insights";
import { useDashboardScreen } from "@/src/features/personal-finance/hooks/use-dashboard-screen";
import { getThemeColors } from "@/src/lib/theme";

function DashboardTopBar({
  onBack,
  title,
}: {
  onBack: () => void;
  title: string;
}) {
  const colors = getThemeColors(useColorScheme());

  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-row items-center gap-4">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-sm bg-secondary"
          onPress={onBack}
        >
          <MaterialIcons color={colors.mutedForeground} name="arrow-back" size={18} />
        </Pressable>
        <Text weight="bold" className="text-xl tracking-tight text-foreground">
          {title}
        </Text>
      </View>

      <View className="h-10 w-10 items-center justify-center rounded-sm border border-border/40 bg-card">
        <MaterialIcons color={colors.accent} name="insights" size={18} />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const isFocused = useIsFocused();
  const colors = getThemeColors(useColorScheme());
  const { activeDebtCount, activeGoalCount, budgetOverview, error, isLoading } =
    useDashboardScreen(isFocused);

  return (
    <Screen scroll keyboardShouldPersistTaps="handled" contentClassName="gap-5 pb-16">
      <Stack.Screen options={{ headerShown: false }} />

      <DashboardTopBar
        title={t("screen.title")}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }

          router.replace("/");
        }}
      />

      <View className="gap-2">
        <Text variant="caption" className="text-primary">
          {t("screen.eyebrow")}
        </Text>
        <Text variant="title" className="text-foreground">
          {t("screen.title")}
        </Text>
        <Text variant="muted">{t("screen.subtitle")}</Text>
      </View>

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

      {!isLoading && !error && !budgetOverview ? (
        <EmptyState
          title={t("screen.emptyTitle")}
          description={t("screen.emptyDescription")}
          action={
            <Button
              onPress={() =>
                router.push({ pathname: "/budgets", params: { tab: "plan" } })
              }
            >
              {t("screen.cta")}
            </Button>
          }
        />
      ) : null}

      {!isLoading && !error && budgetOverview ? (
        <DashboardBudgetInsights
          activeDebtCount={activeDebtCount}
          activeGoalCount={activeGoalCount}
          overview={budgetOverview}
        />
      ) : null}
    </Screen>
  );
}
