import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { getThemeColors, withAlpha } from "@/src/lib/theme";

export default function TabLayout() {
  const { t } = useTranslation(["budget", "common"]);
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: withAlpha(colors.border, 0.25),
          height: 60 + tabBarBottomPadding,
          paddingTop: 8,
          paddingBottom: tabBarBottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },
        headerShown: false,
        /*  tabBarButton: HapticTab, */
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={22} name="home-filled" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: "Explorar",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={22} name="send" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="budgets"
        options={{
          title: t("budget:screen.title", {
            defaultValue: "Plan mensual",
          }),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={22} name="bar-chart" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t("common:actions.settings"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={22} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
