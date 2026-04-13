import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/src/components/ui";

export type BudgetSetupTab<TSectionId extends string = string> = {
  badge?: string | null;
  id: TSectionId;
  label: string;
};

type BudgetSetupTabsProps<TSectionId extends string> = {
  activeSection: TSectionId;
  onChangeSection: (sectionId: TSectionId) => void;
  tabs: BudgetSetupTab<TSectionId>[];
};

export function BudgetSetupTabs<TSectionId extends string>({
  activeSection,
  onChangeSection,
  tabs,
}: BudgetSetupTabsProps<TSectionId>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-3 pr-4">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;

          return (
            <Pressable
              key={tab.id}
              className={[
                "flex-row items-center gap-2 rounded-full border px-4 py-3",
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-border/40 bg-card",
              ].join(" ")}
              onPress={() => onChangeSection(tab.id)}
            >
              <Text
                className={[
                  "text-sm font-semibold",
                  isActive ? "text-primary" : "text-foreground",
                ].join(" ")}
              >
                {tab.label}
              </Text>
              {tab.badge ? (
                <View
                  className={[
                    "rounded-full px-2 py-1",
                    isActive ? "bg-primary/15" : "bg-secondary",
                  ].join(" ")}
                >
                  <Text className="text-[11px] font-bold uppercase tracking-[0.7px] text-muted-foreground">
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
