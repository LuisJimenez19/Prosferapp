import { DEFAULT_LOCALE } from "@/src/i18n/config";
import type { ISODateString } from "@/src/types/common";

export function nowIsoString(): ISODateString {
  return new Date().toISOString();
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateInput(value: string) {
  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    throw new Error("Date must use the YYYY-MM-DD format.");
  }

  const [year, month, day] = trimmedValue.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new Error("Date is invalid.");
  }

  return parsedDate;
}

export function dateInputValueToDate(value: string) {
  return parseDateInput(value);
}

export function toDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function dateInputToIsoString(value: string): ISODateString {
  return parseDateInput(value).toISOString();
}

export function formatDateLabel(value: string, locale = DEFAULT_LOCALE) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}`;
}

export function getMonthDateRange(monthKey: string) {
  if (!/^\d{4}-\d{2}$/.test(monthKey.trim())) {
    throw new Error("Month key must use the YYYY-MM format.");
  }

  const [year, month] = monthKey.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1, 12, 0, 0, 0);
  const endDate = new Date(year, month, 0, 12, 0, 0, 0);

  return {
    start_date: toDateInputValue(startDate),
    end_date: toDateInputValue(endDate),
    start_iso: startDate.toISOString(),
    end_iso: endDate.toISOString(),
    days_in_month: endDate.getDate(),
  };
}

export function getDayOfMonth(date = new Date()) {
  return date.getDate();
}
