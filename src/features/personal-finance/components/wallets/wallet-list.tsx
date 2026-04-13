import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { EmptyState, Text } from "@/src/components/ui";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";

import { WalletListCard } from "@/src/features/personal-finance/components/wallets/wallet-list-card";

type WalletListProps = {
  onDelete: (wallet: Wallet) => void;
  onEdit: (wallet: Wallet) => void;
  wallets: Wallet[];
};

export function WalletList({ onDelete, onEdit, wallets }: WalletListProps) {
  const { t } = useTranslation("wallets");

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="heading">{t("list.title")}</Text>
        <Text variant="muted">{t("list.total", { count: wallets.length })}</Text>
      </View>

      {wallets.length === 0 ? (
        <EmptyState
          compact
          title={t("list.emptyTitle")}
          description={t("list.emptyDescription")}
        />
      ) : (
        wallets.map((wallet) => (
          <WalletListCard
            key={wallet.local_id}
            wallet={wallet}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))
      )}
    </View>
  );
}
