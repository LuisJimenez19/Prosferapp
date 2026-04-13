import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  AppAlertDialog,
  Button,
  Card,
  CardContent,
  Screen,
  Text,
} from "@/src/components/ui";
import { WalletList } from "@/src/features/personal-finance/components/wallets/wallet-list";
import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import { walletRepository } from "@/src/features/personal-finance/repositories/wallet.repository";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { formatCurrency } from "@/src/lib/money";
import { getThemeColors } from "@/src/lib/theme";

type WalletDeleteSummary = NonNullable<
  Awaited<ReturnType<typeof walletRepository.getWalletDeleteSummary>>
>;

function WalletsTopBar({
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
        <Text className="text-[20px] font-bold tracking-tight text-foreground">
          {title}
        </Text>
      </View>

      <View className="h-10 w-10 items-center justify-center rounded-sm border border-border/40 bg-card">
        <MaterialIcons name="account-balance-wallet" size={18} color={colors.accent} />
      </View>
    </View>
  );
}

export default function WalletsScreen() {
  const router = useRouter();
  const { t } = useTranslation(["wallets", "common"]);
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteSummary, setDeleteSummary] = useState<WalletDeleteSummary | null>(
    null,
  );

  const totalBalance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + wallet.current_balance, 0),
    [wallets],
  );
  const primaryCurrency = wallets[0]?.currency_code ?? "ARS";

  const loadWallets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const personalContext = await getPersonalContext();
      const walletResults =
        await walletRepository.listWalletsByOwner(personalContext);

      setWallets(walletResults);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : t("wallets:errors.loadFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    loadWallets().catch((loadError) => {
      const message =
        loadError instanceof Error
          ? loadError.message
          : t("wallets:errors.loadFailed");
      setError(message);
      setIsLoading(false);
    });
  }, [isFocused, loadWallets, t]);

  async function handleDeletePress(wallet: Wallet) {
    const summary = await walletRepository.getWalletDeleteSummary(wallet.local_id);

    if (!summary) {
      setError(t("wallets:errors.deleteSummaryMissing"));
      return;
    }

    setDeleteSummary(summary);
  }

  async function confirmDeleteWallet() {
    if (!deleteSummary) {
      return;
    }

    try {
      const wasDeleted = await walletRepository.softDeleteWallet(
        deleteSummary.wallet.local_id,
      );

      if (!wasDeleted) {
        throw new Error(t("wallets:errors.deleteSummaryMissing"));
      }

      setDeleteSummary(null);
      await loadWallets();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : t("wallets:errors.deleteFailed");
      setError(message);
      Alert.alert(t("wallets:errors.deleteFailedTitle"), message);
    }
  }

  function buildDeleteDescription(summary: WalletDeleteSummary) {
    const descriptionParts = [
      t("wallets:delete.descriptionBase", { name: summary.wallet.name }),
    ];

    if (summary.wallet.current_balance !== 0) {
      descriptionParts.push(
        t("wallets:delete.descriptionBalance", {
          amount: formatCurrency(
            summary.wallet.current_balance,
            summary.wallet.currency_code,
          ),
        }),
      );
    }

    if (summary.transaction_count > 0) {
      descriptionParts.push(
        t("wallets:delete.descriptionTransactions", {
          count: summary.transaction_count,
        }),
      );
    }

    if (summary.wallet.is_default && summary.remaining_wallet_count > 0) {
      descriptionParts.push(t("wallets:delete.descriptionDefault"));
    }

    return descriptionParts.join(" ");
  }

  return (
    <Screen scroll keyboardShouldPersistTaps="handled" contentClassName="gap-5 pb-16">
      <Stack.Screen options={{ headerShown: false }} />

      <WalletsTopBar
        title={t("wallets:screen.title")}
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
          {t("wallets:overview.balanceLabel")}
        </Text>
        <Text className="text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-foreground">
          {formatCurrency(totalBalance, primaryCurrency)}
        </Text>
        <Text variant="muted">{t("wallets:overview.description")}</Text>
      </View>

      <View className="overflow-hidden rounded-lg border border-border/40 bg-secondary px-5 py-5">
        <View className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10" />
        <View className="gap-4">
          <Text className="text-[18px] font-bold leading-7 text-foreground">
            {t("wallets:screen.subtitle")}
          </Text>

          <View className="flex-row flex-wrap gap-3">
            <Button
              className="px-4"
              onPress={() => router.push("/wallet-modal")}
            >
              {t("wallets:actions.createWallet")}
            </Button>
            <Button
              variant="outline"
              className="border-border/60 bg-card px-4"
              onPress={() =>
                router.push({ pathname: "/budgets", params: { tab: "manual" } })
              }
            >
              {t("common:actions.addTransaction")}
            </Button>
          </View>
        </View>
      </View>

      {isLoading ? (
        <Card>
          <CardContent className="items-center gap-3 py-6">
            <ActivityIndicator color={colors.primary} size="small" />
            <Text variant="muted">{t("wallets:loading.wallets")}</Text>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/50">
          <CardContent className="gap-2">
            <Text weight="semibold" className="text-red-700 dark:text-red-300">
              {t("wallets:errors.invalidDetails")}
            </Text>
            <Text
              variant="muted"
              className="text-red-700/80 dark:text-red-300/80"
            >
              {error}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      <WalletList
        wallets={wallets}
        onDelete={(wallet) => {
          handleDeletePress(wallet).catch((deleteError) => {
            const message =
              deleteError instanceof Error
                ? deleteError.message
                : t("wallets:errors.deleteFailed");
            setError(message);
          });
        }}
        onEdit={(wallet) =>
          router.push({
            pathname: "/wallet-modal",
            params: { walletId: wallet.local_id },
          })
        }
      />

      <AppAlertDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("common:actions.delete")}
        description={
          deleteSummary ? buildDeleteDescription(deleteSummary) : ""
        }
        onCancel={() => setDeleteSummary(null)}
        onConfirm={() => {
          confirmDeleteWallet().catch(() => {
            // Errors are handled inside confirmDeleteWallet.
          });
        }}
        open={Boolean(deleteSummary)}
        title={t("wallets:delete.title")}
        tone="destructive"
      />
    </Screen>
  );
}
