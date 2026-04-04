import type { BaseEntity, LocalId, OwnedEntity } from '@/src/types/common';

export type WalletType = 'cash' | 'bank' | 'card' | 'savings' | 'digital' | 'other';

export interface Wallet extends BaseEntity, OwnedEntity {
  name: string;
  wallet_type: WalletType;
  currency_code: string;
  initial_balance: number;
  current_balance: number;
  is_default: boolean;
}

export interface CreateWalletInput extends OwnedEntity {
  name: string;
  wallet_type: WalletType;
  currency_code: string;
  initial_balance?: number;
  current_balance?: number;
  is_default?: boolean;
  server_id?: string | null;
}

export interface UpdateWalletInput {
  name?: string;
  wallet_type?: WalletType;
  currency_code?: string;
  initial_balance?: number;
  current_balance?: number;
  is_default?: boolean;
  server_id?: string | null;
}

export type WalletOwnerFilter = OwnedEntity;

export interface WalletRecord extends Omit<Wallet, 'is_default'> {
  is_default: number;
}

export interface SoftDeleteWalletInput {
  local_id: LocalId;
}
