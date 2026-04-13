import * as React from "react";
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/src/lib/utils";

type SharedScreenProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  edges?: Edge[];
};

type ScrollableScreenProps = SharedScreenProps &
  Omit<ScrollViewProps, "contentContainerStyle" | "style"> & {
    scroll: true;
  };

type StaticScreenProps = SharedScreenProps &
  Omit<ViewProps, "style"> & {
    scroll?: false;
  };

export type ScreenProps = ScrollableScreenProps | StaticScreenProps;

export function Screen({
  children,
  className,
  contentClassName,
  edges = ["top", "left", "right"],
  scroll,
  ...props
}: ScreenProps) {
  if (scroll) {
    const scrollProps = props as Omit<
      ScrollableScreenProps,
      keyof SharedScreenProps | "scroll"
    >;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        <View className={cn("flex-1 bg-background", className)}>
          <ScrollView
            className="flex-1"
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            {...scrollProps}
          >
            <View className={cn("gap-5 px-5 pb-10 pt-6", contentClassName)}>
              {children}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  const viewProps = props as Omit<
    StaticScreenProps,
    keyof SharedScreenProps | "scroll"
  >;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={edges}>
      <View className={cn("flex-1 bg-background", className)}>
        <View
          className={cn("flex-1 px-5 pb-10 pt-6", contentClassName)}
          {...viewProps}
        >
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}
