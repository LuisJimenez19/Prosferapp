import { View } from "react-native";

import { HelpTooltip, Text } from "@/src/components/ui";

type SectionHeaderProps = {
  title: string;
  description: string;
  closeLabel: string;
  tooltipDescription?: string;
  tooltipTitle?: string;
};

export function SectionHeader({
  title,
  description,
  closeLabel,
  tooltipDescription,
  tooltipTitle,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text variant="heading">{title}</Text>
        <Text variant="muted">{description}</Text>
      </View>

      {tooltipTitle && tooltipDescription ? (
        <HelpTooltip
          closeLabel={closeLabel}
          description={tooltipDescription}
          title={tooltipTitle}
        />
      ) : null}
    </View>
  );
}
