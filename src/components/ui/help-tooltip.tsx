import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Text } from "@/src/components/ui/text";
import { getThemeColors } from "@/src/lib/theme";
import { cn } from "@/src/lib/utils";

type HelpTooltipProps = {
  title: string;
  description: string;
  closeLabel: string;
  className?: string;
};

export function HelpTooltip({
  title,
  description,
  closeLabel,
  className,
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const colors = getThemeColors(useColorScheme());

  return (
    <>
      <Pressable
        accessibilityHint={description}
        accessibilityLabel={title}
        accessibilityRole="button"
        className={cn(
          "h-8 w-8 items-center justify-center rounded-full border border-border bg-card",
          className,
        )}
        onPress={() => setOpen(true)}
      >
        <MaterialIcons
          name="info-outline"
          size={16}
          color={colors.mutedForeground}
        />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-5">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />

          <Card className="z-10 w-full max-w-md">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="gap-5">
              <Text variant="muted">{description}</Text>
              <View className="items-end">
                <Button variant="outline" onPress={() => setOpen(false)}>
                  {closeLabel}
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </Modal>
    </>
  );
}
