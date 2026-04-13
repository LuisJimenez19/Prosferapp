import { Button } from "@/src/components/ui";

type StrategyButtonProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

export function StrategyButton({
  isSelected,
  label,
  onPress,
}: StrategyButtonProps) {
  return (
    <Button
      size="sm"
      variant={isSelected ? "secondary" : "outline"}
      className="rounded-xxs"
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
