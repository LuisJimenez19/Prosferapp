import { View } from "react-native";

import { HelpTooltip, Label } from "@/src/components/ui";
import { cn } from "@/src/lib/utils";

type LabelWithHelpProps = {
  label: string;
  closeLabel: string;
  tooltipDescription?: string;
  tooltipTitle?: string;
  className?: View["props"]["className"];
};

export function LabelWithHelp({
  label,
  closeLabel,
  tooltipDescription,
  tooltipTitle,
  className,
}: LabelWithHelpProps) {
  return (
    <View
      className={cn("flex-row items-center justify-between gap-3", className)}
    >
      <Label>{label}</Label>
      {tooltipTitle && tooltipDescription ? (
        <HelpTooltip
          className="h-5 w-5 "
          closeLabel={closeLabel}
          description={tooltipDescription}
          title={tooltipTitle}
        />
      ) : null}
    </View>
  );
}
