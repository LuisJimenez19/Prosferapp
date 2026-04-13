import { Modal, Pressable, View } from "react-native";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Text } from "@/src/components/ui/text";

type AppAlertDialogProps = {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  tone?: "default" | "destructive";
};

export function AppAlertDialog({
  cancelLabel,
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  open,
  title,
  tone = "default",
}: AppAlertDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={open}
    >
      <View className="flex-1 items-center justify-center bg-black/45 px-5">
        <Pressable className="absolute inset-0" onPress={onCancel} />

        <Card className="z-10 w-full max-w-md">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="gap-5">
            <Text variant="muted">{description}</Text>

            <View className="flex-row flex-wrap justify-end gap-3">
              <Button variant="outline" onPress={onCancel}>
                {cancelLabel}
              </Button>
              <Button
                variant={tone === "destructive" ? "destructive" : "default"}
                onPress={onConfirm}
              >
                {confirmLabel}
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}
