import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Card, CardContent, Screen, Text } from "@/src/components/ui";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation(["settings", "common"]);

  return (
    <Screen scroll contentClassName="gap-4">
      <Stack.Screen options={{ title: t("settings:screen.title") }} />

      <View className="gap-2">
        <Text variant="title">{t("settings:screen.title")}</Text>
        <Text variant="muted">{t("settings:screen.subtitle")}</Text>
      </View>

      <Card>
        <CardContent className="gap-4">
          <View className="gap-1">
            <Text weight="semibold">{t("settings:screen.budgetCardTitle")}</Text>
            <Text variant="muted">
              {t("settings:screen.budgetCardDescription")}
            </Text>
          </View>

          <Button
            onPress={() =>
              router.push({ pathname: "/budgets", params: { tab: "plan" } })
            }
          >
            {t("settings:screen.budgetCardAction")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-4">
          <View className="gap-1">
            <Text weight="semibold">{t("settings:screen.resetCardTitle")}</Text>
            <Text variant="muted">
              {t("settings:screen.resetCardDescription")}
            </Text>
          </View>

          <Button onPress={() => router.push("/settings-reset")}>
            {t("settings:screen.resetAction")}
          </Button>
        </CardContent>
      </Card>
    </Screen>
  );
}
