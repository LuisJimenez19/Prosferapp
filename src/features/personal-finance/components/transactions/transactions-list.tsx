import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Text } from "@/src/components/ui";
import {
  getCategoryVisuals,
  getTransactionAmountColor,
} from "@/src/features/personal-finance/services/presentation";
import type { TransactionListItem } from "@/src/features/personal-finance/types/transaction";
import { formatDateLabel } from "@/src/lib/dates";
import { formatCurrency } from "@/src/lib/money";

type TransactionsListProps = {
  transactions: TransactionListItem[];
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
  const amountColor = getTransactionAmountColor(
    transaction.transaction_type,
    colorScheme,
  );
  const signedAmount =
    transaction.transaction_type === "income"
      ? transaction.amount
      : -transaction.amount;
  const title =
    transaction.note?.trim() || transaction.category_name || "Movimiento";
  const metadata = [
    transaction.wallet_name,
    transaction.category_name &&
    transaction.category_name !== title
      ? transaction.category_name
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <View className="flex-row items-center justify-between gap-4 rounded-xl border border-border/40 bg-card px-4 py-4">
      <View className="flex-1 flex-row items-center gap-3">
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
          <Text weight="semibold" className="text-base leading-6 text-foreground">
            {title}
          </Text>
          {metadata ? (
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {metadata}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="items-end gap-1">
        <Text weight="bold" className="text-base leading-6" style={{ color: amountColor }}>
          {formatCurrency(signedAmount, transaction.currency_code)}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {formatDateLabel(transaction.occurred_at)}
        </Text>
      </View>
    </View>
  );
}

export function TransactionsList({ transactions }: TransactionsListProps) {
  return (
    <View className="gap-3">
      {transactions.map((transaction) => (
        <TransactionRow key={transaction.local_id} transaction={transaction} />
      ))}
    </View>
  );
}
