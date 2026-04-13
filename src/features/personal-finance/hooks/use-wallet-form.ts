import { useCallback, useMemo, useState } from "react";

import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import type {
  Wallet,
  WalletType,
} from "@/src/features/personal-finance/types/wallet";

export type WalletFormState = {
  currencyCode: string;
  initialBalance: string;
  isDefaultWallet: boolean;
  name: string;
  walletType: WalletType;
};

function createInitialWalletFormState(
  defaultCurrencyCode = DEFAULT_CURRENCY_CODE,
  hasWallets = false,
): WalletFormState {
  return {
    currencyCode: defaultCurrencyCode,
    initialBalance: "",
    isDefaultWallet: !hasWallets,
    name: "",
    walletType: "cash",
  };
}

export function useWalletForm() {
  const [formState, setFormState] = useState<WalletFormState>(() =>
    createInitialWalletFormState(),
  );

  const resetToCreateMode = useCallback(
    (defaultCurrencyCode = DEFAULT_CURRENCY_CODE, hasWallets = false) => {
      setFormState(createInitialWalletFormState(defaultCurrencyCode, hasWallets));
    },
    [],
  );

  const hydrateFromWallet = useCallback((wallet: Wallet) => {
    setFormState({
      currencyCode: wallet.currency_code,
      initialBalance: "",
      isDefaultWallet: wallet.is_default,
      name: wallet.name,
      walletType: wallet.wallet_type,
    });
  }, []);

  const actions = useMemo(
    () => ({
      setCurrencyCode: (currencyCode: string) => {
        setFormState((currentState) => ({ ...currentState, currencyCode }));
      },
      setInitialBalance: (initialBalance: string) => {
        setFormState((currentState) => ({ ...currentState, initialBalance }));
      },
      setIsDefaultWallet: (isDefaultWallet: boolean) => {
        setFormState((currentState) => ({ ...currentState, isDefaultWallet }));
      },
      setName: (name: string) => {
        setFormState((currentState) => ({ ...currentState, name }));
      },
      setWalletType: (walletType: WalletType) => {
        setFormState((currentState) => ({ ...currentState, walletType }));
      },
    }),
    [],
  );

  return {
    actions,
    formState,
    hydrateFromWallet,
    resetToCreateMode,
  };
}

