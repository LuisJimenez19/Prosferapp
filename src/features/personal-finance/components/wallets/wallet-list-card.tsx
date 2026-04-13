import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Text } from "@/src/components/ui";
import { getWalletVisuals } from "@/src/features/personal-finance/services/presentation";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { formatCurrency } from "@/src/lib/money";

type WalletListCardProps = {
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  wallet: Wallet;
};

export function WalletListCard({
  onDelete,
  onEdit,
  wallet,
}: WalletListCardProps) {
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
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-[18px] font-bold leading-7 text-foreground">
                {wallet.name}
              </Text>
              {wallet.is_default ? (
                <View className="rounded-full bg-primary/10 px-2.5 py-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[1px] text-primary">
                    {t("list.card.defaultLabel")}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="muted">{t(`types.${wallet.wallet_type}`)}</Text>
          </View>
        </View>

        <View className="items-end gap-1">
          <Text className="text-[18px] font-bold leading-7 text-foreground">
            {formatCurrency(wallet.current_balance, wallet.currency_code)}
          </Text>
          <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground">
            {wallet.currency_code}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-lg bg-secondary px-4 py-3">
          <Text variant="caption">{t("list.card.openingBalance")}</Text>
          <Text className="mt-1 text-[15px] font-semibold text-foreground">
            {formatCurrency(wallet.initial_balance, wallet.currency_code)}
          </Text>
        </View>
        <View className="flex-1 rounded-lg bg-secondary px-4 py-3">
          <Text variant="caption">{t("list.card.currency")}</Text>
          <Text className="mt-1 text-[15px] font-semibold text-foreground">
            {wallet.currency_code}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3">
        <Button
          variant="outline"
          className="rounded-lg"
          onPress={() => onEdit(wallet)}
        >
          {t("list.card.edit")}
        </Button>
        <Button
          variant="destructive"
          className="rounded-lg"
          onPress={() => onDelete(wallet)}
        >
          {t("list.card.delete")}
        </Button>
      </View>
    </View>
  );
}
