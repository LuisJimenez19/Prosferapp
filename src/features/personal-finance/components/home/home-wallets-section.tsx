import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button, EmptyState, Text } from "@/src/components/ui";
import { getWalletVisuals } from "@/src/features/personal-finance/services/presentation";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { formatCurrency } from "@/src/lib/money";
import { getThemeColors } from "@/src/lib/theme";

type HomeWalletsSectionProps = {
  featuredWallet: Wallet | null;
  onCreateWallet: () => void;
  onViewWallets: () => void;
  secondaryWallets: Wallet[];
  wallets: Wallet[];
};

function FeaturedWalletCard({ wallet }: { wallet: Wallet }) {
  const { t } = useTranslation(["home", "wallets"]);
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const visuals = getWalletVisuals(wallet.wallet_type, colorScheme);

  return (
    <View className="overflow-hidden rounded-lg bg-accent px-5 py-5">
      <View className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
      <View className="absolute bottom-6 right-5 flex-row gap-2">
        <View className="h-10 w-4 rounded-xxs bg-white/10" />
        <View className="h-14 w-4 rounded-xxs bg-white/10" />
        <View className="h-8 w-4 rounded-xxs bg-white/10" />
      </View>

      <View className="gap-6">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-sm bg-white/15">
              <MaterialIcons
                name={visuals.iconName}
                size={20}
                color={colors.primaryForeground}
              />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-bold leading-7 text-white">
                {wallet.name}
              </Text>
              <Text className="text-sm text-white/80">
                {t(`wallets:types.${wallet.wallet_type}`)}
              </Text>
            </View>
          </View>

          {wallet.is_default ? (
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="text-xs font-bold uppercase tracking-wide text-white">
                {t("home:wallet.defaultBadge")}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-1">
          <Text className="text-sm text-white/80">
            {t("home:wallet.availableLabel")}
          </Text>
          <Text className="text-4xl font-extrabold leading-tight tracking-tight text-white">
            {formatCurrency(wallet.current_balance, wallet.currency_code)}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="rounded-xxs border border-white/15 bg-white/10 px-4 py-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-white/75">
              {t("home:wallet.openingLabel")}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-white">
              {formatCurrency(wallet.initial_balance, wallet.currency_code)}
            </Text>
          </View>
          <View className="rounded-xxs border border-white/15 bg-white/10 px-4 py-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-white/75">
              {wallet.currency_code}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-white">
              {t(`wallets:types.${wallet.wallet_type}`)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function CompactWalletCard({ wallet }: { wallet: Wallet }) {
  const { t } = useTranslation("wallets");
  const colorScheme = useColorScheme();
  const visuals = getWalletVisuals(wallet.wallet_type, colorScheme);

  return (
    <View className="rounded-lg border border-border/40 bg-card px-4 py-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 flex-row items-start gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: visuals.backgroundColor,
              borderColor: visuals.borderColor,
            }}
          >
            <MaterialIcons
              name={visuals.iconName}
              size={20}
              color={visuals.iconColor}
            />
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-lg font-bold leading-7 text-foreground">
              {wallet.name}
            </Text>
            <Text variant="muted">{t(`types.${wallet.wallet_type}`)}</Text>
          </View>
        </View>

        <Text className="text-lg font-bold leading-7 text-foreground">
          {formatCurrency(wallet.current_balance, wallet.currency_code)}
        </Text>
      </View>
    </View>
  );
}

export function HomeWalletsSection({
  featuredWallet,
  onCreateWallet,
  onViewWallets,
  secondaryWallets,
  wallets,
}: HomeWalletsSectionProps) {
  const { t } = useTranslation(["home", "wallets"]);

  return (
    <View className="gap-4">
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            {t("home:sections.wallets.title")}
          </Text>
          <Text variant="muted">{t("home:sections.wallets.subtitle")}</Text>
        </View>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xxs"
          onPress={onViewWallets}
        >
          {t("home:sections.wallets.viewAll")}
        </Button>
      </View>

      {wallets.length === 0 ? (
        <EmptyState
          compact
          title={t("home:sections.wallets.emptyTitle")}
          description={t("home:sections.wallets.emptyDescription")}
          action={
            <Button onPress={onCreateWallet}>
              {t("wallets:actions.createWallet")}
            </Button>
          }
        />
      ) : (
        <View className="gap-3">
          {featuredWallet ? <FeaturedWalletCard wallet={featuredWallet} /> : null}
          {secondaryWallets.map((wallet) => (
            <CompactWalletCard key={wallet.local_id} wallet={wallet} />
          ))}
        </View>
      )}
    </View>
  );
}
