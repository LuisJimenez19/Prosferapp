import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export type AppColorScheme = 'light' | 'dark';

export const APP_THEME = {
  light: {
    background: 'hsl(210 33% 98%)',
    foreground: 'hsl(210 10% 11%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(210 10% 11%)',
    primary: 'hsl(208 89% 44%)',
    primaryForeground: 'hsl(210 33% 99%)',
    secondary: 'hsl(200 17% 95%)',
    secondaryForeground: 'hsl(210 10% 11%)',
    muted: 'hsl(200 17% 95%)',
    mutedForeground: 'hsl(223 8% 48%)',
    accent: 'hsl(208 100% 34%)',
    accentForeground: 'hsl(210 33% 99%)',
    destructive: 'hsl(0 72% 51%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    success: 'hsl(159 100% 21%)',
    successForeground: 'hsl(210 40% 98%)',
    warning: 'hsl(38 92% 50%)',
    warningForeground: 'hsl(30 30% 15%)',
    info: 'hsl(200 100% 28%)',
    infoForeground: 'hsl(210 40% 98%)',
    caution: 'hsl(48 96% 53%)',
    cautionForeground: 'hsl(32 35% 18%)',
    border: 'hsl(223 18% 83%)',
    input: 'hsl(223 18% 83%)',
    ring: 'hsl(208 89% 44%)',
  },
  dark: {
    background: 'hsl(210 16% 10%)',
    foreground: 'hsl(210 33% 98%)',
    card: 'hsl(210 15% 14%)',
    cardForeground: 'hsl(210 33% 98%)',
    primary: 'hsl(208 88% 62%)',
    primaryForeground: 'hsl(210 25% 10%)',
    secondary: 'hsl(210 10% 19%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    muted: 'hsl(210 10% 19%)',
    mutedForeground: 'hsl(220 11% 70%)',
    accent: 'hsl(208 80% 57%)',
    accentForeground: 'hsl(210 25% 10%)',
    destructive: 'hsl(0 62% 54%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    success: 'hsl(153 77% 56%)',
    successForeground: 'hsl(158 100% 8%)',
    warning: 'hsl(38 92% 58%)',
    warningForeground: 'hsl(35 100% 10%)',
    info: 'hsl(200 74% 63%)',
    infoForeground: 'hsl(210 25% 10%)',
    caution: 'hsl(48 96% 60%)',
    cautionForeground: 'hsl(40 100% 10%)',
    border: 'hsl(216 10% 25%)',
    input: 'hsl(216 10% 25%)',
    ring: 'hsl(208 88% 62%)',
  },
} as const;

export const NAV_THEME: Record<AppColorScheme, Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: APP_THEME.light.background,
      border: APP_THEME.light.border,
      card: APP_THEME.light.card,
      notification: APP_THEME.light.destructive,
      primary: APP_THEME.light.primary,
      text: APP_THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: APP_THEME.dark.background,
      border: APP_THEME.dark.border,
      card: APP_THEME.dark.card,
      notification: APP_THEME.dark.destructive,
      primary: APP_THEME.dark.primary,
      text: APP_THEME.dark.foreground,
    },
  },
};

export function getThemeColors(colorScheme: AppColorScheme | null | undefined) {
  return APP_THEME[colorScheme === 'dark' ? 'dark' : 'light'];
}

export function withAlpha(color: string, alpha: number) {
  const normalizedAlpha = Math.min(Math.max(alpha, 0), 1);

  if (color.startsWith("hsl(") && color.endsWith(")")) {
    return `${color.slice(0, -1)} / ${normalizedAlpha})`;
  }

  return color;
}
