import type { ISODateString } from '@/src/types/common';

export function nowIsoString(): ISODateString {
  return new Date().toISOString();
}

export function toDateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dateInputToIsoString(value: string): ISODateString {
  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    throw new Error('Date must use the YYYY-MM-DD format.');
  }

  const parsedDate = new Date(`${trimmedValue}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Date is invalid.');
  }

  return parsedDate.toISOString();
}

export function formatDateLabel(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
