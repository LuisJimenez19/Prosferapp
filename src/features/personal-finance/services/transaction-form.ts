import type { Category } from '@/src/features/personal-finance/types/category';
import type { TransactionKind } from '@/src/features/personal-finance/types/transaction';
import { dateInputToIsoString } from '@/src/lib/dates';
import { parseMoneyInput, type MoneyValidationMessages } from '@/src/lib/money';

export type TransactionFormValues = {
  amount: string;
  dateValue: string;
  selectedCategoryLocalId: string | null;
  selectedWalletLocalId: string | null;
};

export type TransactionValidationMessages = {
  amount?: MoneyValidationMessages;
  categoryRequired?: string;
  walletRequired?: string;
};

export function getCategoriesForTransactionType(
  categories: Category[],
  transactionType: TransactionKind
) {
  return categories.filter((category) => category.category_kind === transactionType);
}

export function validateTransactionForm(
  values: TransactionFormValues,
  messages: TransactionValidationMessages = {},
) {
  if (!values.selectedWalletLocalId) {
    throw new Error(messages.walletRequired ?? 'Please select a wallet.');
  }

  if (!values.selectedCategoryLocalId) {
    throw new Error(messages.categoryRequired ?? 'Please select a category.');
  }

  parseMoneyInput(values.amount, messages.amount);
  dateInputToIsoString(values.dateValue);
}
