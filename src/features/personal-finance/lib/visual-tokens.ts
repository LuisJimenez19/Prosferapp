import type { AppColorScheme } from "@/src/lib/theme";

type VisualTone = {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
};

const PERSONAL_FINANCE_VISUAL_TOKENS = {
  light: {
    brandStrong: {
      backgroundColor: "hsl(216 100% 92%)",
      borderColor: "hsl(216 100% 87%)",
      iconColor: "hsl(208 100% 34%)",
    },
    brandSoft: {
      backgroundColor: "hsl(204 100% 95%)",
      borderColor: "hsl(204 100% 89%)",
      iconColor: "hsl(200 100% 28%)",
    },
    success: {
      backgroundColor: "hsl(152 56% 92%)",
      borderColor: "hsl(150 56% 84%)",
      iconColor: "hsl(159 100% 21%)",
    },
    neutral: {
      backgroundColor: "hsl(210 14% 95%)",
      borderColor: "hsl(210 14% 88%)",
      iconColor: "hsl(223 8% 32%)",
    },
  },
  dark: {
    brandStrong: {
      backgroundColor: "hsl(210 48% 20%)",
      borderColor: "hsl(210 45% 28%)",
      iconColor: "hsl(208 88% 62%)",
    },
    brandSoft: {
      backgroundColor: "hsl(204 35% 22%)",
      borderColor: "hsl(204 32% 30%)",
      iconColor: "hsl(200 74% 63%)",
    },
    success: {
      backgroundColor: "hsl(154 35% 18%)",
      borderColor: "hsl(154 40% 27%)",
      iconColor: "hsl(153 77% 56%)",
    },
    neutral: {
      backgroundColor: "hsl(215 12% 20%)",
      borderColor: "hsl(215 12% 28%)",
      iconColor: "hsl(220 11% 70%)",
    },
  },
} as const satisfies Record<AppColorScheme, Record<string, VisualTone>>;

export function getPersonalFinanceVisualTokens(
  colorScheme: AppColorScheme | null | undefined,
) {
  return PERSONAL_FINANCE_VISUAL_TOKENS[
    colorScheme === "dark" ? "dark" : "light"
  ];
}
