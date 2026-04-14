import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Screen,
  Text,
} from "@/src/components/ui";
import { TransactionsList } from "@/src/features/personal-finance/components/transactions/transactions-list";
import { useTransactionsScreen } from "@/src/features/personal-finance/hooks/use-transactions-screen";
import { formatCurrency } from "@/src/lib/money";
import { getThemeColors } from "@/src/lib/theme";

function TransactionsTopBar({
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
          <MaterialIcons name="arrow-back" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Text weight="bold" className="text-xl tracking-tight text-foreground">
          {title}
        </Text>
      </View>

      <View className="h-10 w-10 items-center justify-center rounded-sm border border-border/40 bg-card">
        <MaterialIcons name="receipt-long" size={18} color={colors.accent} />
      </View>
    </View>
  );
}

function SummaryPill({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <View className={`rounded-xl border border-border/40 bg-card px-4 py-4 ${className ?? ""}`}>
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <Text weight="bold" className="mt-2 text-lg leading-7 text-foreground">
        {value}
      </Text>
    </View>
  );
}

function FilterSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-4">{children}</View>
      </ScrollView>
    </View>
  );
}

function FilterChip({
  isActive,
  label,
  onPress,
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={isActive ? "default" : "outline"}
      className="rounded-full px-4"
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { t } = useTranslation(["transactions", "common"]);
  const isFocused = useIsFocused();
  const colors = getThemeColors(useColorScheme());
  const {
    error,
    filteredTransactions,
    isLoading,
    scopeFilter,
    setScopeFilter,
    setTypeFilter,
    setWalletFilter,
    totals,
    transactions,
    typeFilter,
    walletFilter,
    walletOptions,
  } = useTransactionsScreen(isFocused);
  const currencyCode = transactions[0]?.currency_code ?? "ARS";

  return (
    <Screen scroll keyboardShouldPersistTaps="handled" contentClassName="gap-5 pb-16">
      <Stack.Screen options={{ headerShown: false }} />

      <TransactionsTopBar
        title={t("transactions:common.title")}
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
          {t("transactions:screen.eyebrow")}
        </Text>
        <Text variant="title" className="text-foreground">
          {t("transactions:screen.title")}
        </Text>
        <Text variant="muted">{t("transactions:screen.subtitle")}</Text>
      </View>

      <View className="gap-3">
        <Card className="overflow-hidden border-border/40 bg-secondary">
          <CardContent className="gap-4 py-5">
            <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10" />
            <Text weight="semibold" className="text-base text-foreground">
              {t("transactions:screen.overview.title")}
            </Text>

            <View className="flex-row gap-3">
              <SummaryPill
                className="flex-1"
                label={t("transactions:screen.overview.count")}
                value={String(filteredTransactions.length)}
              />
              <SummaryPill
                className="flex-1"
                label={t("transactions:screen.overview.income")}
                value={formatCurrency(totals.income, currencyCode)}
              />
            </View>

            <SummaryPill
              label={t("transactions:screen.overview.expense")}
              value={formatCurrency(totals.expense, currencyCode)}
            />

            <Button
              className="self-start px-4"
              onPress={() =>
                router.push({ pathname: "/budgets", params: { tab: "manual" } })
              }
            >
              {t("transactions:common.create")}
            </Button>
          </CardContent>
        </Card>
      </View>

      {!isLoading ? (
        <Card>
          <CardContent className="gap-4 py-5">
            <View className="flex-row items-center justify-between gap-3">
              <Text weight="semibold" className="text-base text-foreground">
                {t("transactions:screen.filters.title")}
              </Text>
              <Badge variant="secondary">
                <Text>{t("transactions:screen.results.title", {
                  count: filteredTransactions.length,
                })}</Text>
              </Badge>
            </View>

            <FilterSection title={t("transactions:screen.filters.type")}>
              <FilterChip
                isActive={typeFilter === "all"}
                label={t("transactions:screen.filters.all")}
                onPress={() => setTypeFilter("all")}
              />
              <FilterChip
                isActive={typeFilter === "income"}
                label={t("transactions:screen.filters.income")}
                onPress={() => setTypeFilter("income")}
              />
              <FilterChip
                isActive={typeFilter === "expense"}
                label={t("transactions:screen.filters.expense")}
                onPress={() => setTypeFilter("expense")}
              />
            </FilterSection>

            <FilterSection title={t("transactions:screen.filters.scope")}>
              <FilterChip
                isActive={scopeFilter === "all"}
                label={t("transactions:screen.filters.all")}
                onPress={() => setScopeFilter("all")}
              />
              <FilterChip
                isActive={scopeFilter === "essential"}
                label={t("transactions:screen.filters.essential")}
                onPress={() => setScopeFilter("essential")}
              />
              <FilterChip
                isActive={scopeFilter === "debt"}
                label={t("transactions:screen.filters.debt")}
                onPress={() => setScopeFilter("debt")}
              />
              <FilterChip
                isActive={scopeFilter === "goal"}
                label={t("transactions:screen.filters.goal")}
                onPress={() => setScopeFilter("goal")}
              />
              <FilterChip
                isActive={scopeFilter === "flexible"}
                label={t("transactions:screen.filters.flexible")}
                onPress={() => setScopeFilter("flexible")}
              />
            </FilterSection>

            <FilterSection title={t("transactions:screen.filters.wallet")}>
              <FilterChip
                isActive={walletFilter === "all"}
                label={t("transactions:screen.filters.all")}
                onPress={() => setWalletFilter("all")}
              />
              {walletOptions.map((wallet) => (
                <FilterChip
                  key={wallet.local_id}
                  isActive={walletFilter === wallet.local_id}
                  label={wallet.name}
                  onPress={() => setWalletFilter(wallet.local_id)}
                />
              ))}
            </FilterSection>

            <Text variant="muted">
              {t("transactions:screen.results.description", {
                total: transactions.length,
                visible: filteredTransactions.length,
              })}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="items-center gap-3 py-8">
            <ActivityIndicator color={colors.primary} size="small" />
            <Text variant="muted">{t("transactions:screen.loading")}</Text>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="gap-2">
            <Text weight="semibold" className="text-destructive">
              {t("transactions:screen.errors.title")}
            </Text>
            <Text variant="muted" className="text-destructive/80">
              {error}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error ? (
        filteredTransactions.length === 0 ? (
          <EmptyState
            title={t(
              transactions.length === 0
                ? "transactions:screen.emptyTitle"
                : "transactions:screen.filteredEmptyTitle",
            )}
            description={t(
              transactions.length === 0
                ? "transactions:screen.emptyDescription"
                : "transactions:screen.filteredEmptyDescription",
            )}
            action={
              <Button
                onPress={() =>
                  router.push({ pathname: "/budgets", params: { tab: "manual" } })
                }
              >
                {t("transactions:common.create")}
              </Button>
            }
          />
        ) : (
          <View className="gap-3">
            <Text weight="semibold" className="text-base text-foreground">
              {t("transactions:screen.listTitle")}
            </Text>
            <TransactionsList transactions={filteredTransactions} />
          </View>
        )
      ) : null}
    </Screen>
  );
}
