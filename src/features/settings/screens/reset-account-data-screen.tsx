import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import {
  AppAlertDialog,
  Button,
  Card,
  CardContent,
  Screen,
  Text,
} from "@/src/components/ui";
import { resetDatabase } from "@/src/database/initDatabase";

export default function ResetAccountDataScreen() {
  const router = useRouter();
  const { t } = useTranslation(["settings", "common"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setIsResetting(true);
    setError(null);

    try {
      await resetDatabase();
      setIsDialogOpen(false);
      Alert.alert(
        t("settings:reset.successTitle"),
        t("settings:reset.successDescription"),
      );
      router.replace("/");
    } catch (resetError) {
      const message =
        resetError instanceof Error
          ? resetError.message
          : t("settings:reset.errorDescription");
      setError(message);
      Alert.alert(t("settings:reset.errorTitle"), message);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Screen scroll contentClassName="gap-4">
      <Stack.Screen options={{ title: t("settings:reset.title") }} />

      <View className="gap-2">
        <Text variant="title">{t("settings:reset.title")}</Text>
        <Text variant="muted">{t("settings:reset.subtitle")}</Text>
      </View>

      <Card className="border-warning/30 bg-warning/10">
        <CardContent className="gap-2">
          <Text variant="caption" className="text-warning-foreground">
            {t("settings:reset.warningTitle")}
          </Text>
          <Text weight="semibold">{t("settings:reset.warningDescription")}</Text>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/50">
          <CardContent className="gap-2">
            <Text weight="semibold" className="text-red-700 dark:text-red-300">
              {t("settings:reset.errorTitle")}
            </Text>
            <Text
              variant="muted"
              className="text-red-700/80 dark:text-red-300/80"
            >
              {error}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      <Button
        variant="destructive"
        loading={isResetting}
        onPress={() => setIsDialogOpen(true)}
      >
        {t("settings:reset.submit")}
      </Button>

      <AppAlertDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("common:actions.reset")}
        description={t("settings:reset.confirmDescription")}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={() => {
          handleReset().catch(() => {
            // Errors are handled inside handleReset.
          });
        }}
        open={isDialogOpen}
        title={t("settings:reset.confirmTitle")}
        tone="destructive"
      />
    </Screen>
  );
}

