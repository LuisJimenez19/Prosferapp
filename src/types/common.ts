export type ISODateString = string;

export type LocalId = string;
export type ServerId = string | null;

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
} as const;

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

export type OwnerType = 'personal' | 'business';

export interface Timestamps {
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

export interface SyncMetadata {
  local_id: LocalId;
  server_id: ServerId;
  sync_status: SyncStatus;
  version: number;
}

export interface BaseEntity extends SyncMetadata, Timestamps {}

export interface OwnedEntity {
  owner_type: OwnerType;
  owner_local_id: LocalId;
}

export interface SoftDeleteFields {
  deleted_at: ISODateString | null;
}
