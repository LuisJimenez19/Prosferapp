import type { ComponentProps } from "react";

import type MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { getPersonalFinanceVisualTokens } from "@/src/features/personal-finance/lib/visual-tokens";
import type { Category } from "@/src/features/personal-finance/types/category";
import type { TransactionKind } from "@/src/features/personal-finance/types/transaction";
import type { WalletType } from "@/src/features/personal-finance/types/wallet";
import { getThemeColors, type AppColorScheme } from "@/src/lib/theme";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

type VisualTone = {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  iconName: MaterialIconName;
};

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

export function getWalletVisuals(
  walletType: WalletType,
  colorScheme: AppColorScheme | null | undefined = "light",
): VisualTone {
  const tones = getPersonalFinanceVisualTokens(colorScheme);

  switch (walletType) {
    case "bank":
      return {
        ...tones.brandStrong,
        iconName: "account-balance",
      };
    case "savings":
      return {
        ...tones.brandSoft,
        iconName: "savings",
      };
    case "cash":
      return {
        ...tones.success,
        iconName: "payments",
      };
    case "card":
      return {
        ...tones.neutral,
        iconName: "credit-card",
      };
    case "digital":
      return {
        ...tones.neutral,
        iconName: "account-balance-wallet",
      };
    default:
      return {
        ...tones.neutral,
        iconName: "account-balance-wallet",
      };
  }
}

export function getCategoryVisuals(
  category: Pick<
    Category,
    "category_kind" | "color_hex" | "icon_name" | "name"
  >,
  colorScheme: AppColorScheme | null | undefined = "light",
): VisualTone {
  const tones = getPersonalFinanceVisualTokens(colorScheme);
  const normalizedName = normalizeLabel(category.name);

  if (normalizedName.includes("sueldo") || normalizedName.includes("ingreso")) {
    return {
      ...tones.success,
      iconName: "work-outline",
    };
  }

  if (
    normalizedName.includes("comida") ||
    normalizedName.includes("food") ||
    normalizedName.includes("dining")
  ) {
    return {
      ...tones.brandStrong,
      iconName: "restaurant",
    };
  }

  if (
    normalizedName.includes("transporte") ||
    normalizedName.includes("transport")
  ) {
    return {
      ...tones.success,
      iconName: "directions-car",
    };
  }

  if (
    normalizedName.includes("entretenimiento") ||
    normalizedName.includes("fun") ||
    normalizedName.includes("ocio")
  ) {
    return {
      ...tones.neutral,
      iconName: "sports-esports",
    };
  }

  if (
    normalizedName.includes("super") ||
    normalizedName.includes("grocery") ||
    normalizedName.includes("mercado")
  ) {
    return {
      ...tones.neutral,
      iconName: "shopping-cart",
    };
  }

  if (normalizedName.includes("salud") || normalizedName.includes("health")) {
    return {
      ...tones.neutral,
      iconName: "local-hospital",
    };
  }

  if (
    normalizedName.includes("servicio") ||
    normalizedName.includes("utilities") ||
    normalizedName.includes("internet") ||
    normalizedName.includes("luz") ||
    normalizedName.includes("gas")
  ) {
    return {
      ...tones.brandSoft,
      iconName: "home-repair-service",
    };
  }

  if (
    normalizedName.includes("entrenamiento") ||
    normalizedName.includes("gym") ||
    normalizedName.includes("fitness")
  ) {
    return {
      ...tones.success,
      iconName: "fitness-center",
    };
  }

  if (category.category_kind === "income") {
    return {
      ...tones.success,
      iconName: "trending-up",
    };
  }

  return {
    ...tones.brandSoft,
    iconName: "receipt-long",
  };
}

export function getTransactionAmountColor(
  transactionType: TransactionKind,
  colorScheme: AppColorScheme | null | undefined = "light",
) {
  if (transactionType === "income") {
    return getPersonalFinanceVisualTokens(colorScheme).success.iconColor;
  }

  return getThemeColors(colorScheme).destructive;
}
