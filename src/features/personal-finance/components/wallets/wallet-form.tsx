import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Text,
} from "@/src/components/ui";
import {
  normalizeCurrencyCode,
  WALLET_TYPE_OPTIONS,
} from "@/src/features/personal-finance/services/wallet-form";
import type { Wallet, WalletType } from "@/src/features/personal-finance/types/wallet";
import type { WalletFormState } from "@/src/features/personal-finance/hooks/use-wallet-form";
import { formatCurrency } from "@/src/lib/money";

type WalletFormProps = {
  editingWallet: Wallet | null;
  formState: WalletFormState;
  isSaving: boolean;
  onCreateNew: () => void;
  onCurrencyCodeChange: (value: string) => void;
  onDefaultWalletChange: (value: boolean) => void;
  onInitialBalanceChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onWalletTypeChange: (value: WalletType) => void;
  showAddTransactionAction?: boolean;
  onAddTransaction?: () => void;
};

type SelectionChipProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

function SelectionChip({ isSelected, label, onPress }: SelectionChipProps) {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      className="rounded-full"
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="gap-3">{children}</CardContent>
    </Card>
  );
}

export function WalletForm({
  editingWallet,
  formState,
  isSaving,
  onCreateNew,
  onCurrencyCodeChange,
  onDefaultWalletChange,
  onInitialBalanceChange,
  onNameChange,
  onSubmit,
  onWalletTypeChange,
  showAddTransactionAction = true,
  onAddTransaction,
}: WalletFormProps) {
  const { t } = useTranslation(["common", "wallets"]);

  return (
    <FormSection
      title={
        editingWallet
          ? t("wallets:form.editTitle")
          : t("wallets:form.createTitle")
      }
      description={
        editingWallet
          ? t("wallets:form.editDescription")
          : t("wallets:form.createDescription")
      }
    >
      <View className="gap-2">
        <Label>{t("wallets:form.fields.name")}</Label>
        <Input
          value={formState.name}
          onChangeText={onNameChange}
          placeholder={t("wallets:form.placeholders.name")}
        />
      </View>

      <View className="gap-2">
        <Label>{t("wallets:form.fields.walletType")}</Label>
        <View className="flex-row flex-wrap gap-3">
          {WALLET_TYPE_OPTIONS.map((option) => (
            <SelectionChip
              key={option}
              isSelected={formState.walletType === option}
              label={t(`wallets:types.${option}`)}
              onPress={() => onWalletTypeChange(option)}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Label>{t("wallets:form.fields.currencyCode")}</Label>
        <Input
          value={formState.currencyCode}
          onChangeText={(value) =>
            onCurrencyCodeChange(normalizeCurrencyCode(value))
          }
          placeholder={t("wallets:form.placeholders.currencyCode")}
          autoCapitalize="characters"
          maxLength={3}
        />
      </View>

      {editingWallet ? (
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1 rounded-2xl bg-secondary px-4 py-3">
            <Text variant="caption">{t("wallets:form.fields.openingBalance")}</Text>
            <Text weight="medium">
              {formatCurrency(
                editingWallet.initial_balance,
                editingWallet.currency_code,
              )}
            </Text>
          </View>
          <View className="flex-1 gap-1 rounded-2xl bg-secondary px-4 py-3">
            <Text variant="caption">{t("wallets:form.fields.currentBalance")}</Text>
            <Text
              weight="medium"
              className={
                editingWallet.current_balance >= 0
                  ? "text-success"
                  : "text-destructive"
              }
            >
              {formatCurrency(
                editingWallet.current_balance,
                editingWallet.currency_code,
              )}
            </Text>
          </View>
        </View>
      ) : (
        <View className="gap-2">
          <Label>{t("wallets:form.fields.openingBalance")}</Label>
          <Input
            value={formState.initialBalance}
            onChangeText={onInitialBalanceChange}
            placeholder={t("wallets:form.placeholders.openingBalance")}
            keyboardType="decimal-pad"
          />
        </View>
      )}

      <View className="gap-2">
        <Label>{t("wallets:form.fields.defaultWallet")}</Label>
        <View className="flex-row flex-wrap gap-3">
          <SelectionChip
            isSelected={formState.isDefaultWallet}
            label={t("common:actions.yes")}
            onPress={() => onDefaultWalletChange(true)}
          />
          <SelectionChip
            isSelected={!formState.isDefaultWallet}
            label={t("common:actions.no")}
            onPress={() => onDefaultWalletChange(false)}
          />
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Button loading={isSaving} onPress={onSubmit}>
          {editingWallet
            ? t("wallets:form.submitEdit")
            : t("wallets:form.submitCreate")}
        </Button>
        {editingWallet ? (
          <Button variant="outline" onPress={onCreateNew}>
            {t("wallets:form.createNew")}
          </Button>
        ) : null}
        {showAddTransactionAction && onAddTransaction ? (
          <Button variant="ghost" onPress={onAddTransaction}>
            {t("common:actions.addTransaction")}
          </Button>
        ) : null}
      </View>
    </FormSection>
  );
}
