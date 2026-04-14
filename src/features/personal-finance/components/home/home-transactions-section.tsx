import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, EmptyState, Text } from "@/src/components/ui";
import { TransactionsList } from "@/src/features/personal-finance/components/transactions/transactions-list";
import type { TransactionListItem } from "@/src/features/personal-finance/types/transaction";

type HomeTransactionsSectionProps = {
  latestTransactions: TransactionListItem[];
  onAddTransaction: () => void;
  onViewAll: () => void;
};

export function HomeTransactionsSection({
  latestTransactions,
  onAddTransaction,
  onViewAll,
}: HomeTransactionsSectionProps) {
  const { t } = useTranslation("home");

  return (
    <View className="gap-4">
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text weight="bold" className="text-2xl tracking-tight text-foreground">
            {t("sections.transactions.title")}
          </Text>
          <Text variant="muted">{t("sections.transactions.subtitle")}</Text>
        </View>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xxs"
          onPress={onAddTransaction}
        >
          {t("sections.transactions.action")}
        </Button>
      </View>

      {latestTransactions.length === 0 ? (
        <EmptyState
          compact
          title={t("sections.transactions.emptyTitle")}
          description={t("sections.transactions.emptyDescription")}
          action={
            <Button onPress={onAddTransaction}>
              {t("plan.addTransactionAction")}
            </Button>
          }
        />
      ) : (
        <View className="gap-3">
          <TransactionsList transactions={latestTransactions} />
          <Button variant="outline" className="self-start px-4" onPress={onViewAll}>
            {t("sections.transactions.viewAll")}
          </Button>
        </View>
      )}
    </View>
  );
}
