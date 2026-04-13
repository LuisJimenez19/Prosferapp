import type { WalletType } from '@/src/features/personal-finance/types/wallet';
import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import {
  parseMoneyInput,
  type MoneyValidationMessages,
} from '@/src/lib/money';

export const WALLET_TYPE_OPTIONS: WalletType[] = [
  'cash',
  'bank',
  'card',
  'savings',
  'digital',
  'other',
];

export type WalletFormValues = {
  currencyCode: string;
  initialBalance: string;
  name: string;
};

export type WalletFormValidationMessages = {
  amount?: MoneyValidationMessages;
  currencyInvalid?: string;
  nameRequired?: string;
};

export function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase();
}

export function validateWalletForm(
  values: WalletFormValues,
  messages: WalletFormValidationMessages = {},
) {
  if (!values.name.trim()) {
    throw new Error(messages.nameRequired ?? 'Wallet name is required.');
  }

  const currencyCode = normalizeCurrencyCode(values.currencyCode);

  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    throw new Error(
      messages.currencyInvalid ??
        `Currency code must use 3 letters, for example ${DEFAULT_CURRENCY_CODE}.`,
    );
  }

  const initialBalance = values.initialBalance.trim()
    ? parseMoneyInput(values.initialBalance, messages.amount)
    : 0;

  return {
    currencyCode,
    initialBalance,
    name: values.name.trim(),
  };
}
