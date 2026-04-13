import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Card, CardContent, Screen, Text } from "@/src/components/ui";
import { WalletForm } from "@/src/features/personal-finance/components/wallets/wallet-form";
import { useWalletForm } from "@/src/features/personal-finance/hooks/use-wallet-form";
import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import { walletRepository } from "@/src/features/personal-finance/repositories/wallet.repository";
import { validateWalletForm } from "@/src/features/personal-finance/services/wallet-form";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import { getThemeColors } from "@/src/lib/theme";

type PersonalOwnerContext = Awaited<ReturnType<typeof getPersonalContext>>;

export default function WalletModalScreen() {
  const router = useRouter();
  const { t } = useTranslation("wallets");
  const { walletId } = useLocalSearchParams<{ walletId?: string }>();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const [context, setContext] = useState<PersonalOwnerContext | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { actions, formState, hydrateFromWallet, resetToCreateMode } =
    useWalletForm();

  useEffect(() => {
    let isMounted = true;

    async function loadModalData() {
      setIsLoading(true);
      setError(null);

      try {
        const personalContext = await getPersonalContext();
        const walletResults =
          await walletRepository.listWalletsByOwner(personalContext);

        if (!isMounted) {
          return;
        }

        setContext(personalContext);
        setWallets(walletResults);

        if (walletId) {
          const existingWallet =
            walletResults.find((wallet) => wallet.local_id === walletId) ?? null;

          if (!existingWallet) {
            throw new Error(t("errors.walletNotFound"));
          }

          setEditingWallet(existingWallet);
          hydrateFromWallet(existingWallet);
        } else {
          setEditingWallet(null);
          resetToCreateMode(
            walletResults[0]?.currency_code ?? DEFAULT_CURRENCY_CODE,
            walletResults.length > 0,
          );
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : t("errors.loadFailed");
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadModalData().catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message =
        loadError instanceof Error
          ? loadError.message
          : t("errors.loadFailed");
      setError(message);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [hydrateFromWallet, resetToCreateMode, t, walletId]);

  async function handleSave() {
    if (!context) {
      setError(t("errors.missingContext"));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const validatedWallet = validateWalletForm(
        {
          currencyCode: formState.currencyCode,
          initialBalance: formState.initialBalance,
          name: formState.name,
        },
        {
          amount: {
            invalidFormat: t("validation.amountInvalid"),
            nonPositive: t("validation.amountPositive"),
            required: t("validation.amountRequired"),
          },
          currencyInvalid: t("validation.currencyInvalid"),
          nameRequired: t("validation.nameRequired"),
        },
      );

      if (editingWallet) {
        await walletRepository.updateWallet(editingWallet.local_id, {
          currency_code: validatedWallet.currencyCode,
          is_default: formState.isDefaultWallet,
          name: validatedWallet.name,
          wallet_type: formState.walletType,
        });
      } else {
        await walletRepository.createWallet({
          owner_type: context.owner_type,
          owner_local_id: context.owner_local_id,
          currency_code: validatedWallet.currencyCode,
          current_balance: validatedWallet.initialBalance,
          initial_balance: validatedWallet.initialBalance,
          is_default: formState.isDefaultWallet,
          name: validatedWallet.name,
          wallet_type: formState.walletType,
        });
      }

      router.back();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : t("errors.saveFailed");
      setError(message);
      Alert.alert(t("errors.saveFailedTitle"), message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen scroll keyboardShouldPersistTaps="handled" contentClassName="gap-4">
      <Stack.Screen
        options={{
          title: editingWallet ? t("form.editTitle") : t("form.createTitle"),
        }}
      />

      <View className="gap-2">
        <Text variant="title">
          {editingWallet ? t("form.editTitle") : t("form.createTitle")}
        </Text>
        <Text variant="muted">
          {editingWallet ? t("form.editDescription") : t("form.createDescription")}
        </Text>
      </View>

      {isLoading ? (
        <Card>
          <CardContent className="items-center gap-3 py-6">
            <ActivityIndicator color={colors.primary} size="small" />
            <Text variant="muted">{t("loading.wallets")}</Text>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/50">
          <CardContent className="gap-2">
            <Text weight="semibold" className="text-red-700 dark:text-red-300">
              {t("errors.invalidDetails")}
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

      {!isLoading ? (
        <WalletForm
          editingWallet={editingWallet}
          formState={formState}
          isSaving={isSaving}
          onCreateNew={() => {
            setEditingWallet(null);
            resetToCreateMode(
              wallets[0]?.currency_code ?? DEFAULT_CURRENCY_CODE,
              wallets.length > 0,
            );
          }}
          onCurrencyCodeChange={actions.setCurrencyCode}
          onDefaultWalletChange={actions.setIsDefaultWallet}
          onInitialBalanceChange={actions.setInitialBalance}
          onNameChange={actions.setName}
          onSubmit={() => {
            handleSave().catch(() => {
              // Errors are handled inside handleSave.
            });
          }}
          onWalletTypeChange={actions.setWalletType}
          showAddTransactionAction={false}
        />
      ) : null}
    </Screen>
  );
}
