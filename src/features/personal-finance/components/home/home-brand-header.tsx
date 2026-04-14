import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Text } from "@/src/components/ui";
import { getThemeColors } from "@/src/lib/theme";

export function HomeBrandHeader() {
  const colors = getThemeColors(useColorScheme());

  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-sm bg-secondary">
          <MaterialIcons name="show-chart" size={18} color={colors.accent} />
        </View>
        <Text className="text-xl font-bold tracking-tight text-foreground">
          ProsferApp
        </Text>
      </View>

      <View className="h-10 w-10 items-center justify-center rounded-sm border border-border/50 bg-card">
        <MaterialIcons
          name="person-outline"
          size={20}
          color={colors.mutedForeground}
        />
      </View>
    </View>
  );
}
