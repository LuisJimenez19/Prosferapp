import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Text } from "@/src/components/ui/text";
import { formatDateLabel, toDateInputValue } from "@/src/lib/dates";
import { getThemeColors } from "@/src/lib/theme";
import { cn } from "@/src/lib/utils";

type DatePickerFieldProps = {
  value: Date | null;
  onChange: (value: Date) => void;
  placeholder: string;
  cancelLabel: string;
  confirmLabel: string;
  dialogTitle: string;
  className?: string;
  disabled?: boolean;
  displayValue?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  mode?: "date" | "time" | "datetime";
};

export function DatePickerField({
  value,
  onChange,
  placeholder,
  cancelLabel,
  confirmLabel,
  dialogTitle,
  className,
  disabled = false,
  displayValue,
  maximumDate,
  minimumDate,
  mode = "date",
}: DatePickerFieldProps) {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<Date>(value ?? new Date());

  useEffect(() => {
    if (open) {
      setDraftValue(value ?? new Date());
    }
  }, [open, value]);

  const resolvedDisplayValue =
    displayValue ??
    (value ? formatDateLabel(toDateInputValue(value)) : placeholder);

  function closePicker() {
    setOpen(false);
  }

  function handleAndroidChange(
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    if (event.type === "dismissed" || !selectedDate) {
      closePicker();
      return;
    }

    onChange(selectedDate);
    closePicker();
  }

  function handleIosConfirm() {
    onChange(draftValue);
    closePicker();
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        className={cn(
          "min-h-12 flex-row items-center justify-between rounded-lg border border-input bg-card px-4 py-3",
          disabled && "opacity-60",
          className,
        )}
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        <Text className={value ? "text-foreground" : "text-muted-foreground"}>
          {resolvedDisplayValue}
        </Text>
        <MaterialIcons name="calendar-today" size={18} color={colors.mutedForeground} />
      </Pressable>

      {Platform.OS === "android" && open ? (
        <DateTimePicker
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          mode={mode}
          value={draftValue}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS !== "android" && open ? (
        <Modal
          animationType="fade"
          onRequestClose={closePicker}
          transparent
          visible={open}
        >
          <View className="flex-1 items-center justify-center bg-black/45 px-5">
            <Pressable className="absolute inset-0" onPress={closePicker} />

            <Card className="z-10 w-full max-w-md">
              <CardHeader>
                <CardTitle>{dialogTitle}</CardTitle>
              </CardHeader>
              <CardContent className="gap-5">
                <DateTimePicker
                  display="spinner"
                  maximumDate={maximumDate}
                  minimumDate={minimumDate}
                  mode={mode}
                  value={draftValue}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setDraftValue(selectedDate);
                    }
                  }}
                />

                <View className="flex-row justify-end gap-3">
                  <Button variant="outline" onPress={closePicker}>
                    {cancelLabel}
                  </Button>
                  <Button onPress={handleIosConfirm}>{confirmLabel}</Button>
                </View>
              </CardContent>
            </Card>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
