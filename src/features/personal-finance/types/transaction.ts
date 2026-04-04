import type { BaseEntity, OwnedEntity } from '@/src/types/common';

export type TransactionKind = 'income' | 'expense';

export interface Transaction extends BaseEntity, OwnedEntity {
  wallet_local_id: string;
  category_local_id: string | null;
  related_sale_local_id: string | null;
  related_purchase_local_id: string | null;
  transaction_type: TransactionKind;
  direction: TransactionKind;
  amount: number;
  currency_code: string;
  occurred_at: string;
  note: string | null;
  reference_type: string | null;
  reference_local_id: string | null;
}

export interface CreateTransactionInput extends OwnedEntity {
  wallet_local_id: string;
  category_local_id: string;
  transaction_type: TransactionKind;
  amount: number;
  currency_code?: string;
  occurred_at: string;
  note?: string;
}

export type TransactionRecord = Transaction;

export interface TransactionListItem extends Transaction {
  wallet_name: string;
  category_name: string | null;
}
