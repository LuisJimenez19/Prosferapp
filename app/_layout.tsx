import "@/src/i18n";
import "../global.css";

import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Card, CardContent, Screen, Text } from "@/src/components/ui";
import { initDatabase } from "@/src/database/initDatabase";
import { NAV_THEME, getThemeColors } from "@/src/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore repeated calls during fast refresh.
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const resolvedColorScheme = colorScheme === "dark" ? "dark" : "light";
  const colors = getThemeColors(colorScheme);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function prepareApp() {
      try {
        await initDatabase();
        if (isMounted) {
          setIsDatabaseReady(true);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : "Unknown database initialization error.";
          setDatabaseError(message);
        }
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepareApp().catch((error) => {
      if (isMounted) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown database initialization error.";
        setDatabaseError(message);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isDatabaseReady) {
    if (databaseError) {
      return (
        <Screen contentClassName="flex-1 justify-center">
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="items-center gap-3 py-8">
              <Text variant="heading" className="text-center text-destructive">
                Database initialization failed
              </Text>
              <Text variant="muted" className="text-center text-destructive/80">
                {databaseError}
              </Text>
            </CardContent>
          </Card>
        </Screen>
      );
    }

    return (
      <Screen contentClassName="flex-1 items-center justify-center gap-4">
        <ActivityIndicator color={colors.primary} size="small" />
        <Text variant="muted">Preparing your local data...</Text>
      </Screen>
    );
  }

  return (
    <ThemeProvider value={NAV_THEME[resolvedColorScheme]}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="wallet-modal"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="settings-reset"
          options={{ title: "Configuracion" }}
        />
        <Stack.Screen name="wallets" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
