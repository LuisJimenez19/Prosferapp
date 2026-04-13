import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_LOCALE,
} from "@/src/i18n/config";

export type MoneyValidationMessages = {
  invalidFormat?: string;
  nonPositive?: string;
  required?: string;
};

export function formatCurrency(
  amount: number,
  currencyCode = DEFAULT_CURRENCY_CODE,
  locale = DEFAULT_LOCALE,
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: DEFAULT_CURRENCY_CODE,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

function normalizeMoneyInput(value: string) {
  const compactValue = value.trim().replace(/\s/g, "");

  if (!compactValue) {
    return "";
  }

  const hasComma = compactValue.includes(",");
  const hasDot = compactValue.includes(".");

  if (hasComma && hasDot) {
    return compactValue.lastIndexOf(",") > compactValue.lastIndexOf(".")
      ? compactValue.replace(/\./g, "").replace(",", ".")
      : compactValue.replace(/,/g, "");
  }

  if (hasComma) {
    return compactValue.replace(",", ".");
  }

  return compactValue;
}

export function parseMoneyInput(
  value: string,
  messages: MoneyValidationMessages = {},
) {
  const normalizedValue = normalizeMoneyInput(value);

  if (!normalizedValue) {
    throw new Error(messages.required ?? "Amount is required.");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error(
      messages.invalidFormat ?? "Use a valid amount with up to 2 decimals.",
    );
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(
      messages.nonPositive ?? "Amount must be greater than zero.",
    );
  }

  return parsedValue;
}
