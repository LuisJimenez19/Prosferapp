import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDatabase } from '@/src/database/initDatabase';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore repeated calls during fast refresh.
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
          const message = error instanceof Error ? error.message : 'Unknown database initialization error.';
          setDatabaseError(message);
        }
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepareApp().catch((error) => {
      if (isMounted) {
        const message = error instanceof Error ? error.message : 'Unknown database initialization error.';
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Database initialization failed</Text>
          <Text style={styles.errorMessage}>{databaseError}</Text>
        </View>
      );
    }

    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Add transaction' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff8f6',
  },
  errorTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#8a1c12',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5c2b24',
    textAlign: 'center',
  },
});
