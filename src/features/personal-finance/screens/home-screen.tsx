import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Card, CardContent, Screen, Text } from "@/src/components/ui";
import { HomeBrandHeader } from "@/src/features/personal-finance/components/home/home-brand-header";
import { HomeBudgetSection } from "@/src/features/personal-finance/components/home/home-budget-section";
import { HomeTransactionsSection } from "@/src/features/personal-finance/components/home/home-transactions-section";
import { HomeWalletsSection } from "@/src/features/personal-finance/components/home/home-wallets-section";
import { useHomeScreen } from "@/src/features/personal-finance/hooks/use-home-screen";
import { getThemeColors } from "@/src/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation("home");
  const colors = getThemeColors(useColorScheme());
  const isFocused = useIsFocused();
  const {
    activeDebtCount,
    activeGoalCount,
    budgetOverview,
    error,
    featuredWallet,
    isLoading,
    latestTransactions,
    secondaryWallets,
    wallets,
  } = useHomeScreen(isFocused);

  return (
    <Screen scroll contentClassName="gap-6 pb-16">
      <HomeBrandHeader />

      <View className="gap-2">
        <Text variant="caption" className="text-primary">
          {t("screen.eyebrow")}
        </Text>
        <Text className="text-3xl font-extrabold leading-10 tracking-tight text-foreground">
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

      {!isLoading && !error ? (
        <>
          <HomeBudgetSection
            activeDebtCount={activeDebtCount}
            activeGoalCount={activeGoalCount}
            budgetOverview={budgetOverview}
            onQuickAdd={() =>
              router.push({ pathname: "/budgets", params: { tab: "manual" } })
            }
            onSetupPlan={() =>
              router.push({ pathname: "/budgets", params: { tab: "plan" } })
            }
            onViewDashboard={() => router.push("/dashboard")}
          />

          <HomeWalletsSection
            featuredWallet={featuredWallet}
            onCreateWallet={() => router.push("/wallet-modal")}
            onViewWallets={() => router.push("/wallets")}
            secondaryWallets={secondaryWallets}
            wallets={wallets}
          />

          <HomeTransactionsSection
            latestTransactions={latestTransactions}
            onAddTransaction={() =>
              router.push({ pathname: "/budgets", params: { tab: "manual" } })
            }
            onViewAll={() => router.push("/transactions")}
          />
        </>
      ) : null}
    </Screen>
  );
}
