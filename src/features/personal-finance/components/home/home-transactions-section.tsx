import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button, EmptyState, Text } from "@/src/components/ui";
import {
  getCategoryVisuals,
  getTransactionAmountColor,
} from "@/src/features/personal-finance/services/presentation";
import type { TransactionListItem } from "@/src/features/personal-finance/types/transaction";
import { formatDateLabel } from "@/src/lib/dates";
import { formatCurrency } from "@/src/lib/money";

type HomeTransactionsSectionProps = {
  latestTransactions: TransactionListItem[];
  onAddTransaction: () => void;
};

function TransactionRow({ transaction }: { transaction: TransactionListItem }) {
  const colorScheme = useColorScheme();
  const visuals = getCategoryVisuals(
    {
      category_kind: transaction.transaction_type,
      color_hex: null,
      icon_name: null,
      name: transaction.category_name ?? transaction.note ?? "Movimiento",
    },
    colorScheme,
  );
  const signedAmount =
    transaction.transaction_type === "income"
      ? transaction.amount
      : -transaction.amount;
  const amountColor = getTransactionAmountColor(
    transaction.transaction_type,
    colorScheme,
  );

  return (
    <View className="flex-row items-center justify-between rounded-lg bg-card px-4 py-4">
      <View className="flex-1 flex-row items-center gap-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: visuals.backgroundColor }}
        >
          <MaterialIcons
            name={visuals.iconName}
            size={20}
            color={visuals.iconColor}
          />
        </View>

        <View className="flex-1 gap-1">
          <Text className="text-[16px] font-bold leading-6 text-foreground">
            {transaction.note || transaction.category_name || "Movimiento"}
          </Text>
          <Text className="text-[12px] font-medium uppercase tracking-[0.7px] text-muted-foreground">
            {transaction.wallet_name} • {formatDateLabel(transaction.occurred_at)}
          </Text>
        </View>
      </View>

      <Text className="text-[16px] font-bold leading-6" style={{ color: amountColor }}>
        {formatCurrency(signedAmount, transaction.currency_code)}
      </Text>
    </View>
  );
}

export function HomeTransactionsSection({
  latestTransactions,
  onAddTransaction,
}: HomeTransactionsSectionProps) {
  const { t } = useTranslation("home");

  return (
    <View className="gap-4">
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[24px] font-bold tracking-[-0.6px] text-foreground">
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
          action={<Button onPress={onAddTransaction}>{t("plan.addTransactionAction")}</Button>}
        />
      ) : (
        latestTransactions.map((transaction) => (
          <TransactionRow key={transaction.local_id} transaction={transaction} />
        ))
      )}
    </View>
  );
}
