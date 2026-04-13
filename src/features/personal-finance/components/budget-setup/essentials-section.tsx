import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Label,
  Text,
} from "@/src/components/ui";
import type { ExpenseDraft } from "@/src/features/personal-finance/services/budget-setup-form";
import { SectionHeader } from "./section-header";

type EssentialsSectionProps = {
  expenseDrafts: ExpenseDraft[];
  onCreateEssentialCategory: (name: string) => Promise<void>;
  onRemoveEssentialCategory: (categoryLocalId: string) => Promise<void>;
  onRenameEssentialCategory: (
    categoryLocalId: string,
    nextName: string,
  ) => Promise<void>;
  onUpdateExpenseDraft: (
    categoryLocalId: string,
    updates: Partial<ExpenseDraft>,
  ) => void;
};

function ManageEssentialCard({
  draft,
  onDelete,
  onEdit,
}: {
  draft: ExpenseDraft;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <View className="gap-3 rounded-lg border border-border/40 bg-card px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text weight="semibold">{draft.category_name}</Text>
          <Text variant="muted">
            {draft.is_system ? "Predefinido" : "Personalizado"}
          </Text>
        </View>
        {draft.is_system ? (
          <View className="rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-primary">
              Base
            </Text>
          </View>
        ) : null}
      </View>

      {!draft.is_system ? (
        <View className="flex-row flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xxs"
            onPress={onEdit}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xxs"
            onPress={onDelete}
          >
            Quitar de esenciales
          </Button>
        </View>
      ) : (
        <Text variant="muted">
          Esta categoria viene con la app y no se puede renombrar ni quitar.
        </Text>
      )}
    </View>
  );
}

export function EssentialsSection({
  expenseDrafts,
  onCreateEssentialCategory,
  onRemoveEssentialCategory,
  onRenameEssentialCategory,
  onUpdateExpenseDraft,
}: EssentialsSectionProps) {
  const { t } = useTranslation(["budget", "common"]);
  const [isManaging, setIsManaging] = useState(false);
  const [editingCategoryLocalId, setEditingCategoryLocalId] = useState<
    string | null
  >(null);
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedCategoryInput = categoryNameInput.trim().toLowerCase();
  const exactCategoryMatch = useMemo(
    () =>
      expenseDrafts.find(
        (draft) =>
          draft.category_name.trim().toLowerCase() ===
            normalizedCategoryInput &&
          draft.category_local_id !== editingCategoryLocalId,
      ) ?? null,
    [editingCategoryLocalId, expenseDrafts, normalizedCategoryInput],
  );

  async function handleCreateOrRenameCategory() {
    const trimmedName = categoryNameInput.trim();

    if (!trimmedName) {
      setLocalError(t("budget:sections.essentials.validation.nameRequired"));
      return;
    }

    if (exactCategoryMatch) {
      setLocalError(t("budget:sections.essentials.validation.nameDuplicate"));
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      if (editingCategoryLocalId) {
        await onRenameEssentialCategory(editingCategoryLocalId, trimmedName);
      } else {
        await onCreateEssentialCategory(trimmedName);
      }

      setCategoryNameInput("");
      setEditingCategoryLocalId(null);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : t("budget:sections.essentials.validation.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveCategory(categoryLocalId: string) {
    setIsSubmitting(true);
    setLocalError(null);

    try {
      await onRemoveEssentialCategory(categoryLocalId);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : t("budget:sections.essentials.validation.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="gap-4 py-5">
        <SectionHeader
          closeLabel={t("common:actions.confirm")}
          description={t("budget:sections.essentials.description")}
          title={t("budget:sections.essentials.title")}
        />

        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <Text variant="muted">
            {isManaging
              ? t("budget:sections.essentials.manageMode")
              : t("budget:sections.essentials.quickMode")}
          </Text>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xxs"
            onPress={() => {
              setIsManaging((currentValue) => !currentValue);
              setEditingCategoryLocalId(null);
              setCategoryNameInput("");
              setLocalError(null);
            }}
          >
            {isManaging
              ? t("budget:sections.essentials.closeManage")
              : t("budget:sections.essentials.openManage")}
          </Button>
        </View>

        {localError ? (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="gap-2">
              <Text weight="semibold" className="text-destructive">
                {t("budget:errors.title")}
              </Text>
              <Text variant="muted" className="text-destructive/80">
                {localError}
              </Text>
            </CardContent>
          </Card>
        ) : null}

        {isManaging ? (
          <View className="gap-4 rounded-lg bg-secondary px-4 py-4">
            <View className="gap-2">
              <Label>{t("budget:sections.essentials.nameLabel")}</Label>
              <Input
                value={categoryNameInput}
                onChangeText={setCategoryNameInput}
                placeholder={t("budget:sections.essentials.namePlaceholder")}
                className="rounded-lg border-border/40 bg-card"
              />
            </View>

            <View className="flex-row flex-wrap gap-3">
              <Button
                loading={isSubmitting}
                className="rounded-lg"
                onPress={() => {
                  handleCreateOrRenameCategory().catch(() => {
                    // Errors are handled inside handleCreateOrRenameCategory.
                  });
                }}
              >
                {editingCategoryLocalId
                  ? t("budget:sections.essentials.renameAction")
                  : t("budget:sections.essentials.createAction")}
              </Button>
              {editingCategoryLocalId ? (
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onPress={() => {
                    setEditingCategoryLocalId(null);
                    setCategoryNameInput("");
                    setLocalError(null);
                  }}
                >
                  {t("budget:sections.essentials.cancelEditAction")}
                </Button>
              ) : null}
            </View>

            {expenseDrafts.length === 0 ? (
              <EmptyState
                compact
                title={t("budget:sections.essentials.emptyTitle")}
                description={t("budget:sections.essentials.emptyDescription")}
              />
            ) : (
              <View className="gap-3">
                {expenseDrafts.map((draft) => (
                  <ManageEssentialCard
                    key={draft.category_local_id}
                    draft={draft}
                    onDelete={() => {
                      handleRemoveCategory(draft.category_local_id).catch(
                        () => {
                          // Errors are handled inside handleRemoveCategory.
                        },
                      );
                    }}
                    onEdit={() => {
                      setEditingCategoryLocalId(draft.category_local_id);
                      setCategoryNameInput(draft.category_name);
                      setLocalError(null);
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : expenseDrafts.length === 0 ? (
          <EmptyState
            compact
            title={t("budget:sections.essentials.emptyTitle")}
            description={t("budget:sections.essentials.emptyDescription")}
            action={
              <Button onPress={() => setIsManaging(true)}>
                {t("budget:sections.essentials.openManage")}
              </Button>
            }
          />
        ) : (
          expenseDrafts.map((draft) => (
            <View
              key={draft.category_local_id}
              className="flex-row items-center gap-3 rounded-lg bg-secondary px-4 py-3"
            >
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text weight="semibold">{draft.category_name}</Text>
                  {draft.is_system ? (
                    <View className="rounded-full bg-primary/10 px-2 py-0.5">
                      <Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-primary">
                        Base
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="muted">
                  {t("budget:sections.essentials.amountLabel")}
                </Text>
              </View>
              <Input
                value={draft.amount}
                keyboardType="decimal-pad"
                className="min-h-11 w-32"
                onChangeText={(value) =>
                  onUpdateExpenseDraft(draft.category_local_id, {
                    amount: value,
                  })
                }
              />
            </View>
          ))
        )}
      </CardContent>
    </Card>
  );
}
