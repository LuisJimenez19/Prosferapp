import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  AppAlertDialog,
  Button,
  Card,
  CardContent,
  DatePickerField,
  EmptyState,
  Input,
  Label,
  Text,
} from "@/src/components/ui";
import {
  getCategoriesForTransactionType,
  validateTransactionForm,
} from "@/src/features/personal-finance/services/transaction-form";
import { categoryRepository } from "@/src/features/personal-finance/repositories/category.repository";
import { getPersonalContext } from "@/src/features/personal-finance/repositories/personal-context.repository";
import { transactionRepository } from "@/src/features/personal-finance/repositories/transaction.repository";
import { walletRepository } from "@/src/features/personal-finance/repositories/wallet.repository";
import { getCategoryVisuals, getWalletVisuals } from "@/src/features/personal-finance/services/presentation";
import type { Category } from "@/src/features/personal-finance/types/category";
import type {
  TransactionKind,
} from "@/src/features/personal-finance/types/transaction";
import type { Wallet } from "@/src/features/personal-finance/types/wallet";
import { DEFAULT_CURRENCY_CODE } from "@/src/i18n/config";
import {
  dateInputToIsoString,
  dateInputValueToDate,
  formatDateLabel,
  toDateInputValue,
} from "@/src/lib/dates";
import { formatCurrency, parseMoneyInput } from "@/src/lib/money";
import { getThemeColors } from "@/src/lib/theme";

type PersonalOwnerContext = Awaited<ReturnType<typeof getPersonalContext>>;
type CategoryDeleteSummary = NonNullable<
  Awaited<ReturnType<typeof categoryRepository.getCategoryDeleteSummary>>
>;
type SaveMode = "close" | "continue";
type CreateTransactionModalScreenProps = {
  embedded?: boolean;
  onSaved?: () => void;
};

function TransactionTypeChip({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={[
        "rounded-full px-4 py-2",
        isSelected ? "bg-card" : "bg-transparent",
      ].join(" ")}
      onPress={onPress}
    >
      <Text
        className={[
          "text-sm font-semibold",
          isSelected ? "text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function QuickCategoryCard({
  category,
  isSelected,
  onPress,
}: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const visuals = getCategoryVisuals(category, colorScheme);

  return (
    <Pressable
      className={[
        "w-[31%] items-center justify-center gap-2 rounded-lg border bg-card px-3 py-5",
        isSelected ? "border-primary" : "border-border/40",
      ].join(" ")}
      onPress={onPress}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: visuals.backgroundColor }}
      >
        <MaterialIcons
          name={visuals.iconName}
          size={20}
          color={visuals.iconColor}
        />
      </View>
      <Text
        className={[
          "text-center text-[11px] font-bold uppercase tracking-[0.7px]",
          isSelected ? "text-primary" : "text-muted-foreground",
        ].join(" ")}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

function DetailLabelRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-10 w-10 items-center justify-center rounded-sm bg-card">
        {icon}
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-muted-foreground">
          {label}
        </Text>
        <Text className="text-[16px] font-semibold text-foreground">{value}</Text>
      </View>
    </View>
  );
}

function ManageCategoryCard({
  category,
  isSelected,
  onDelete,
  onEdit,
  onSelect,
}: {
  category: Category;
  isSelected: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSelect: () => void;
}) {
  const colorScheme = useColorScheme();
  const visuals = getCategoryVisuals(category, colorScheme);

  return (
    <View
      className={[
        "rounded-lg border bg-card px-4 py-4",
        isSelected ? "border-primary" : "border-border/40",
      ].join(" ")}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: visuals.backgroundColor }}
          >
            <MaterialIcons
              name={visuals.iconName}
              size={20}
              color={visuals.iconColor}
            />
          </View>
          <Text className="flex-1 text-[16px] font-semibold text-foreground">
            {category.name}
          </Text>
        </View>
        <Button
          size="sm"
          variant={isSelected ? "default" : "outline"}
          className="rounded-xxs"
          onPress={onSelect}
        >
          Seleccionar
        </Button>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3">
        {!category.is_system ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xxs"
            onPress={onEdit}
          >
            Editar
          </Button>
        ) : null}
        {!category.is_system ? (
          <Button
            size="sm"
            variant="destructive"
            className="rounded-xxs"
            onPress={onDelete}
          >
            Eliminar
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export default function CreateTransactionModalScreen({
  embedded = false,
  onSaved,
}: CreateTransactionModalScreenProps = {}) {
  const router = useRouter();
  const { t } = useTranslation(["transactions", "common"]);
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const amountInputRef = useRef<TextInput | null>(null);
  const [context, setContext] = useState<PersonalOwnerContext | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactionType, setTransactionType] =
    useState<TransactionKind>("expense");
  const [selectedWalletLocalId, setSelectedWalletLocalId] = useState<
    string | null
  >(null);
  const [selectedCategoryLocalId, setSelectedCategoryLocalId] = useState<
    string | null
  >(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dateValue, setDateValue] = useState(toDateInputValue());
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [categoryDeleteSummary, setCategoryDeleteSummary] =
    useState<CategoryDeleteSummary | null>(null);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [showNoteField, setShowNoteField] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFormData() {
      setIsLoading(true);
      setError(null);

      try {
        const personalContext = await getPersonalContext();
        const [walletResults, categoryResults] = await Promise.all([
          walletRepository.listWalletsByOwner(personalContext),
          categoryRepository.listCategoriesByOwner(
            personalContext.owner_type,
            personalContext.owner_local_id,
          ),
        ]);

        if (!isMounted) {
          return;
        }

        setContext(personalContext);
        setWallets(walletResults);
        setCategories(categoryResults);
        setSelectedWalletLocalId(
          (currentValue) => currentValue ?? walletResults[0]?.local_id ?? null,
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : t("transactions:createScreen.errors.loadFailed");
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFormData().catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message =
        loadError instanceof Error
          ? loadError.message
          : t("transactions:createScreen.errors.loadFailed");
      setError(message);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    const matchingCategories = getCategoriesForTransactionType(
      categories,
      transactionType,
    );

    setSelectedCategoryLocalId((currentValue) => {
      if (
        currentValue &&
        matchingCategories.some(
          (category) => category.local_id === currentValue,
        )
      ) {
        return currentValue;
      }

      return matchingCategories[0]?.local_id ?? null;
    });
  }, [categories, transactionType]);

  useEffect(() => {
    if (description) {
      setShowNoteField(true);
    }
  }, [description]);

  useEffect(() => {
    if (!editingCategoryId) {
      return;
    }

    const stillExists = categories.some(
      (category) => category.local_id === editingCategoryId,
    );

    if (!stillExists) {
      setEditingCategoryId(null);
      setCategoryNameInput("");
    }
  }, [categories, editingCategoryId]);

  const categoriesForType = useMemo(
    () => getCategoriesForTransactionType(categories, transactionType),
    [categories, transactionType],
  );
  const normalizedCategoryInput = categoryNameInput.trim().toLowerCase();
  const filteredCategories = categoriesForType.filter((category) =>
    normalizedCategoryInput
      ? category.name.toLowerCase().includes(normalizedCategoryInput)
      : true,
  );
  const exactCategoryMatch = categoriesForType.find(
    (category) =>
      category.name.trim().toLowerCase() === normalizedCategoryInput,
  );
  const selectedWallet = wallets.find(
    (wallet) => wallet.local_id === selectedWalletLocalId,
  );
  const amountPreview = (() => {
    try {
      if (!amount.trim()) {
        return null;
      }

      const parsed = parseMoneyInput(amount, {
        invalidFormat: t("transactions:createScreen.validation.amountInvalid"),
        nonPositive: t("transactions:createScreen.validation.amountPositive"),
        required: t("transactions:createScreen.validation.amountRequired"),
      });

      return formatCurrency(
        transactionType === "income" ? parsed : -parsed,
        selectedWallet?.currency_code ?? DEFAULT_CURRENCY_CODE,
      );
    } catch {
      return null;
    }
  })();

  async function handleCreateOrUpdateCategory() {
    if (!context) {
      setError(t("transactions:createScreen.errors.missingContext"));
      return;
    }

    const trimmedName = categoryNameInput.trim();

    if (!trimmedName) {
      setError(t("transactions:createScreen.validation.categoryNameRequired"));
      return;
    }

    const duplicateCategory = categoriesForType.find(
      (category) =>
        category.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        category.local_id !== editingCategoryId,
    );

    if (duplicateCategory) {
      setError(t("transactions:createScreen.validation.categoryDuplicate"));
      return;
    }

    try {
      if (editingCategoryId) {
        const updatedCategory = await categoryRepository.updateCategory(
          editingCategoryId,
          { name: trimmedName },
        );

        if (!updatedCategory) {
          throw new Error(
            t("transactions:createScreen.validation.categorySaveFailed"),
          );
        }

        setCategories((currentCategories) =>
          currentCategories.map((category) =>
            category.local_id === updatedCategory.local_id
              ? updatedCategory
              : category,
          ),
        );
        setSelectedCategoryLocalId(updatedCategory.local_id);
      } else {
        const createdCategory = await categoryRepository.createCategory({
          owner_type: context.owner_type,
          owner_local_id: context.owner_local_id,
          category_kind: transactionType,
          name: trimmedName,
        });

        setCategories((currentCategories) => [...currentCategories, createdCategory]);
        setSelectedCategoryLocalId(createdCategory.local_id);
      }

      setCategoryNameInput("");
      setEditingCategoryId(null);
      setError(null);
      setIsManagingCategories(false);
    } catch (categoryError) {
      const message =
        categoryError instanceof Error
          ? categoryError.message.includes("already exists")
            ? t("transactions:createScreen.validation.categoryDuplicate")
            : categoryError.message
          : t("transactions:createScreen.validation.categorySaveFailed");
      setError(message);
    }
  }

  function startCategoryEdit(category: Category) {
    setEditingCategoryId(category.local_id);
    setCategoryNameInput(category.name);
    setSelectedCategoryLocalId(category.local_id);
    setIsManagingCategories(true);
    setError(null);
  }

  async function handleDeleteCategoryPress(category: Category) {
    const summary = await categoryRepository.getCategoryDeleteSummary(
      category.local_id,
    );

    if (!summary) {
      setError(t("transactions:createScreen.validation.categoryDeleteFailed"));
      return;
    }

    setCategoryDeleteSummary(summary);
  }

  async function confirmDeleteCategory() {
    if (!categoryDeleteSummary) {
      return;
    }

    try {
      const wasDeleted = await categoryRepository.softDeleteCategory(
        categoryDeleteSummary.category.local_id,
      );

      if (!wasDeleted) {
        throw new Error(
          t("transactions:createScreen.validation.categoryDeleteFailed"),
        );
      }

      setCategories((currentCategories) =>
        currentCategories.filter(
          (category) =>
            category.local_id !== categoryDeleteSummary.category.local_id,
        ),
      );

      if (selectedCategoryLocalId === categoryDeleteSummary.category.local_id) {
        setSelectedCategoryLocalId(null);
      }

      if (editingCategoryId === categoryDeleteSummary.category.local_id) {
        setEditingCategoryId(null);
        setCategoryNameInput("");
      }

      setCategoryDeleteSummary(null);
    } catch (categoryError) {
      const message =
        categoryError instanceof Error
          ? categoryError.message
          : t("transactions:createScreen.validation.categoryDeleteFailed");
      setError(message);
    }
  }

  async function handleSave(mode: SaveMode) {
    if (!context) {
      setError(t("transactions:createScreen.errors.missingContext"));
      return;
    }

    try {
      validateTransactionForm(
        {
          amount,
          dateValue,
          selectedCategoryLocalId,
          selectedWalletLocalId,
        },
        {
          amount: {
            invalidFormat: t("transactions:createScreen.validation.amountInvalid"),
            nonPositive: t("transactions:createScreen.validation.amountPositive"),
            required: t("transactions:createScreen.validation.amountRequired"),
          },
          categoryRequired: t(
            "transactions:createScreen.validation.categoryRequired",
          ),
          walletRequired: t("transactions:createScreen.validation.walletRequired"),
        },
      );
    } catch (validationError) {
      const message =
        validationError instanceof Error
          ? validationError.message
          : t("transactions:createScreen.errors.invalidForm");
      setError(message);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (!selectedWalletLocalId || !selectedCategoryLocalId) {
        throw new Error(
          t("transactions:createScreen.errors.incompleteSelection"),
        );
      }

      const safeAmount = parseMoneyInput(amount, {
        invalidFormat: t("transactions:createScreen.validation.amountInvalid"),
        nonPositive: t("transactions:createScreen.validation.amountPositive"),
        required: t("transactions:createScreen.validation.amountRequired"),
      });

      await transactionRepository.createTransaction({
        owner_type: context.owner_type,
        owner_local_id: context.owner_local_id,
        wallet_local_id: selectedWalletLocalId,
        category_local_id: selectedCategoryLocalId,
        transaction_type: transactionType,
        amount: safeAmount,
        occurred_at: dateInputToIsoString(dateValue),
        note: description,
      });

      if (mode === "continue" || embedded) {
        setAmount("");
        setDescription("");
        setShowNoteField(false);
        setDateValue(toDateInputValue());
        onSaved?.();
        amountInputRef.current?.focus();
        return;
      }

      onSaved?.();
      router.back();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : t("transactions:createScreen.errors.saveFailed");
      setError(message);
      Alert.alert(t("transactions:createScreen.errors.saveFailedTitle"), message);
    } finally {
      setIsSaving(false);
    }
  }

  const selectedWalletVisuals = selectedWallet
    ? getWalletVisuals(selectedWallet.wallet_type, colorScheme)
    : null;

  const content = (
    <>
      {isLoading ? (
        <View className="items-center justify-center gap-3 px-5 py-8">
          <ActivityIndicator color={colors.primary} size="small" />
          <Text variant="muted">{t("transactions:createScreen.loading")}</Text>
        </View>
      ) : (
        <>
          {embedded ? (
            <View className="gap-6">
              {error ? (
                <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/50">
                  <CardContent className="gap-2">
                    <Text
                      weight="semibold"
                      className="text-red-700 dark:text-red-300"
                    >
                      {t("transactions:createScreen.errors.invalidForm")}
                    </Text>
                    <Text
                      variant="muted"
                      className="text-red-700/80 dark:text-red-300/80"
                    >
                      {error}
                    </Text>
                  </CardContent>
                </Card>
              ) : null}

              <View className="rounded-lg border border-border/40 bg-card px-5 py-6">
                <View className="self-center rounded-full bg-secondary p-1">
                  <View className="flex-row items-center">
                    <TransactionTypeChip
                      isSelected={transactionType === "expense"}
                      label={t("transactions:common.expense")}
                      onPress={() => setTransactionType("expense")}
                    />
                    <TransactionTypeChip
                      isSelected={transactionType === "income"}
                      label={t("transactions:common.income")}
                      onPress={() => setTransactionType("income")}
                    />
                  </View>
                </View>

                <View className="mt-6 items-center">
                  <Text className="text-[11px] font-medium uppercase tracking-[2px] text-muted-foreground">
                    {t(
                      transactionType === "expense"
                        ? "transactions:createScreen.sections.amountHero.expenseEyebrow"
                        : "transactions:createScreen.sections.amountHero.incomeEyebrow",
                    )}
                  </Text>

                  <TextInput
                    ref={amountInputRef}
                    value={amount}
                    onChangeText={setAmount}
                    className="mt-3 w-full text-center text-[64px] font-extrabold leading-[72px] tracking-[-3px] text-foreground"
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.primary}
                  />

                  <Text className="mt-2 text-sm font-medium text-muted-foreground">
                    {amountPreview ??
                      t("transactions:createScreen.quickEntry.empty")}
                  </Text>
                </View>
              </View>

              {wallets.length === 0 ? (
                <EmptyState
                  compact
                  title={t("transactions:createScreen.errors.noWalletsTitle")}
                  description={t(
                    "transactions:createScreen.errors.noWalletsDescription",
                  )}
                  action={
                    <Button onPress={() => router.push("/wallet-modal")}>
                      {t("common:actions.create")}
                    </Button>
                  }
                />
              ) : (
                <View className="gap-4">
                  <View className="flex-row items-end justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="text-[20px] font-bold leading-7 text-foreground">
                        {t("transactions:createScreen.sections.category.title")}
                      </Text>
                      <Text variant="muted">
                        {t(
                          isManagingCategories
                            ? "transactions:createScreen.sections.category.manageMode"
                            : "transactions:createScreen.sections.category.quickMode",
                        )}
                      </Text>
                    </View>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xxs"
                      onPress={() => {
                        setIsManagingCategories((currentValue) => !currentValue);
                        setCategoryNameInput("");
                        setEditingCategoryId(null);
                      }}
                    >
                      {t(
                        isManagingCategories
                          ? "transactions:createScreen.sections.category.closeManage"
                          : "transactions:createScreen.sections.category.toggleManage",
                      )}
                    </Button>
                  </View>

                  {isManagingCategories ? (
                    <View className="gap-4 rounded-lg bg-secondary px-4 py-4">
                      <View className="gap-2">
                        <Label>
                          {t(
                            "transactions:createScreen.sections.category.searchLabel",
                          )}
                        </Label>
                        <Input
                          value={categoryNameInput}
                          onChangeText={setCategoryNameInput}
                          placeholder={t(
                            "transactions:createScreen.sections.category.searchPlaceholder",
                          )}
                          className="rounded-lg border-border/40 bg-card"
                        />
                      </View>

                      <View className="flex-row flex-wrap gap-3">
                        {editingCategoryId ? (
                          <>
                            <Button
                              className="rounded-lg"
                              onPress={() => {
                                handleCreateOrUpdateCategory().catch(() => {
                                  // Errors are handled inside handleCreateOrUpdateCategory.
                                });
                              }}
                            >
                              {t(
                                "transactions:createScreen.sections.category.update",
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-lg"
                              onPress={() => {
                                setEditingCategoryId(null);
                                setCategoryNameInput("");
                              }}
                            >
                              {t(
                                "transactions:createScreen.sections.category.cancelEdit",
                              )}
                            </Button>
                          </>
                        ) : categoryNameInput.trim() && !exactCategoryMatch ? (
                          <Button
                            className="rounded-lg"
                            onPress={() => {
                              handleCreateOrUpdateCategory().catch(() => {
                                // Errors are handled inside handleCreateOrUpdateCategory.
                              });
                            }}
                          >
                            {t(
                              "transactions:createScreen.sections.category.create",
                              {
                                name: categoryNameInput.trim(),
                              },
                            )}
                          </Button>
                        ) : null}
                      </View>

                      {filteredCategories.length === 0 ? (
                        <EmptyState
                          compact
                          title={
                            categoriesForType.length === 0
                              ? t(
                                  "transactions:createScreen.errors.noCategoriesTitle",
                                )
                              : t(
                                  "transactions:createScreen.sections.category.emptySearch",
                                )
                          }
                          description={t(
                            "transactions:createScreen.errors.noCategoriesDescription",
                            {
                              type: t(
                                `transactions:createScreen.categoryKinds.${transactionType}`,
                              ),
                            },
                          )}
                        />
                      ) : (
                        <View className="gap-3">
                          {filteredCategories.map((category) => (
                            <ManageCategoryCard
                              key={category.local_id}
                              category={category}
                              isSelected={
                                selectedCategoryLocalId === category.local_id
                              }
                              onSelect={() =>
                                setSelectedCategoryLocalId(category.local_id)
                              }
                              onEdit={() => startCategoryEdit(category)}
                              onDelete={() => {
                                handleDeleteCategoryPress(category).catch(() => {
                                  // Errors are handled inside handleDeleteCategoryPress.
                                });
                              }}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : categoriesForType.length === 0 ? (
                    <EmptyState
                      compact
                      title={t("transactions:createScreen.errors.noCategoriesTitle")}
                      description={t(
                        "transactions:createScreen.errors.noCategoriesDescription",
                        {
                          type: t(
                            `transactions:createScreen.categoryKinds.${transactionType}`,
                          ),
                        },
                      )}
                      action={
                        <Button onPress={() => setIsManagingCategories(true)}>
                          {t(
                            "transactions:createScreen.sections.category.toggleManage",
                          )}
                        </Button>
                      }
                    />
                  ) : (
                    <View className="flex-row flex-wrap justify-between gap-y-3">
                      {categoriesForType.map((category) => (
                        <QuickCategoryCard
                          key={category.local_id}
                          category={category}
                          isSelected={
                            selectedCategoryLocalId === category.local_id
                          }
                          onPress={() =>
                            setSelectedCategoryLocalId(category.local_id)
                          }
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              <View className="rounded-lg bg-secondary px-5 py-5">
                <View className="gap-1">
                  <Text className="text-[20px] font-bold leading-7 text-foreground">
                    {t("transactions:createScreen.sections.details.title")}
                  </Text>
                  <Text variant="muted">
                    {t("transactions:createScreen.sections.wallet.helper")}
                  </Text>
                </View>

                <View className="mt-5 gap-5">
                  <DetailLabelRow
                    icon={
                      <MaterialIcons
                        name={
                          selectedWalletVisuals?.iconName ??
                          "account-balance-wallet"
                        }
                        size={18}
                        color={selectedWalletVisuals?.iconColor ?? colors.accent}
                      />
                    }
                    label={t("transactions:createScreen.sections.wallet.title")}
                    value={selectedWallet?.name ?? "-"}
                  />

                  {wallets.length > 1 ? (
                    <ScrollView
                      horizontal
                      contentContainerStyle={{ gap: 12 }}
                      showsHorizontalScrollIndicator={false}
                    >
                      {wallets.map((wallet) => {
                        const isSelected =
                          selectedWalletLocalId === wallet.local_id;

                        return (
                          <Button
                            key={wallet.local_id}
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className="rounded-lg"
                            onPress={() => setSelectedWalletLocalId(wallet.local_id)}
                          >
                            {wallet.name}
                          </Button>
                        );
                      })}
                    </ScrollView>
                  ) : null}

                  <DetailLabelRow
                    icon={
                      <MaterialIcons
                        name="calendar-today"
                        size={16}
                        color={colors.mutedForeground}
                      />
                    }
                    label={t("transactions:createScreen.sections.date.title")}
                    value={formatDateLabel(dateValue)}
                  />

                  <DatePickerField
                    cancelLabel={t("common:actions.cancel")}
                    confirmLabel={t("common:actions.confirm")}
                    dialogTitle={t(
                      "transactions:createScreen.sections.date.title",
                    )}
                    onChange={(value) => {
                      setDateValue(toDateInputValue(value));
                    }}
                    placeholder={t(
                      "transactions:createScreen.sections.date.placeholder",
                    )}
                    className="rounded-lg border-0 bg-card"
                    value={dateInputValueToDate(dateValue)}
                  />

                  {showNoteField ? (
                    <Input
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t(
                        "transactions:createScreen.sections.description.placeholder",
                      )}
                      className="rounded-lg border-0 bg-card"
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      className="justify-start rounded-lg bg-card"
                      textClassName="text-muted-foreground"
                      onPress={() => setShowNoteField(true)}
                    >
                      {t(
                        "transactions:createScreen.sections.description.placeholder",
                      )}
                    </Button>
                  )}
                </View>
              </View>

              <View className="gap-3">
                <Button
                  fullWidth
                  variant="secondary"
                  disabled={!selectedWalletLocalId || !selectedCategoryLocalId}
                  onPress={() => {
                    handleSave("continue").catch(() => {
                      // Errors are handled inside handleSave.
                    });
                  }}
                >
                  {t("transactions:createScreen.sections.submit.actionAndContinue")}
                </Button>

                <Button
                  fullWidth
                  loading={isSaving}
                  disabled={!selectedWalletLocalId || !selectedCategoryLocalId}
                  onPress={() => {
                    handleSave("close").catch(() => {
                      // Errors are handled inside handleSave.
                    });
                  }}
                >
                  {t("transactions:createScreen.sections.submit.action")}
                </Button>
              </View>
            </View>
          ) : (
            <>
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="gap-6 px-5 pb-6 pt-6">
                  {error ? (
                    <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/50">
                      <CardContent className="gap-2">
                        <Text
                          weight="semibold"
                          className="text-red-700 dark:text-red-300"
                        >
                          {t("transactions:createScreen.errors.invalidForm")}
                        </Text>
                        <Text
                          variant="muted"
                          className="text-red-700/80 dark:text-red-300/80"
                        >
                          {error}
                        </Text>
                      </CardContent>
                    </Card>
                  ) : null}

                  <View className="rounded-lg border border-border/40 bg-card px-5 py-6">
                    <View className="self-center rounded-full bg-secondary p-1">
                      <View className="flex-row items-center">
                        <TransactionTypeChip
                          isSelected={transactionType === "expense"}
                          label={t("transactions:common.expense")}
                          onPress={() => setTransactionType("expense")}
                        />
                        <TransactionTypeChip
                          isSelected={transactionType === "income"}
                          label={t("transactions:common.income")}
                          onPress={() => setTransactionType("income")}
                        />
                      </View>
                    </View>

                    <View className="mt-6 items-center">
                      <Text className="text-[11px] font-medium uppercase tracking-[2px] text-muted-foreground">
                        {t(
                          transactionType === "expense"
                            ? "transactions:createScreen.sections.amountHero.expenseEyebrow"
                            : "transactions:createScreen.sections.amountHero.incomeEyebrow",
                        )}
                      </Text>

                      <TextInput
                        ref={amountInputRef}
                        value={amount}
                        onChangeText={setAmount}
                        autoFocus
                        className="mt-3 w-full text-center text-[64px] font-extrabold leading-[72px] tracking-[-3px] text-foreground"
                        keyboardType="decimal-pad"
                        placeholder="0,00"
                        placeholderTextColor={colors.mutedForeground}
                        selectionColor={colors.primary}
                      />

                      <Text className="mt-2 text-sm font-medium text-muted-foreground">
                        {amountPreview ??
                          t("transactions:createScreen.quickEntry.empty")}
                      </Text>
                    </View>
                  </View>

                  {wallets.length === 0 ? (
                    <EmptyState
                      compact
                      title={t("transactions:createScreen.errors.noWalletsTitle")}
                      description={t(
                        "transactions:createScreen.errors.noWalletsDescription",
                      )}
                      action={
                        <Button onPress={() => router.push("/wallet-modal")}>
                          {t("common:actions.create")}
                        </Button>
                      }
                    />
                  ) : (
                    <View className="gap-4">
                      <View className="flex-row items-end justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-[20px] font-bold leading-7 text-foreground">
                            {t("transactions:createScreen.sections.category.title")}
                          </Text>
                          <Text variant="muted">
                            {t(
                              isManagingCategories
                                ? "transactions:createScreen.sections.category.manageMode"
                                : "transactions:createScreen.sections.category.quickMode",
                            )}
                          </Text>
                        </View>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xxs"
                          onPress={() => {
                            setIsManagingCategories((currentValue) => !currentValue);
                            setCategoryNameInput("");
                            setEditingCategoryId(null);
                          }}
                        >
                          {t(
                            isManagingCategories
                              ? "transactions:createScreen.sections.category.closeManage"
                              : "transactions:createScreen.sections.category.toggleManage",
                          )}
                        </Button>
                      </View>

                      {isManagingCategories ? (
                        <View className="gap-4 rounded-lg bg-secondary px-4 py-4">
                          <View className="gap-2">
                            <Label>
                              {t(
                                "transactions:createScreen.sections.category.searchLabel",
                              )}
                            </Label>
                            <Input
                              value={categoryNameInput}
                              onChangeText={setCategoryNameInput}
                              placeholder={t(
                                "transactions:createScreen.sections.category.searchPlaceholder",
                              )}
                              className="rounded-lg border-border/40 bg-card"
                            />
                          </View>

                          <View className="flex-row flex-wrap gap-3">
                            {editingCategoryId ? (
                              <>
                                <Button
                                  className="rounded-lg"
                                  onPress={() => {
                                    handleCreateOrUpdateCategory().catch(() => {
                                      // Errors are handled inside handleCreateOrUpdateCategory.
                                    });
                                  }}
                                >
                                  {t(
                                    "transactions:createScreen.sections.category.update",
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="rounded-lg"
                                  onPress={() => {
                                    setEditingCategoryId(null);
                                    setCategoryNameInput("");
                                  }}
                                >
                                  {t(
                                    "transactions:createScreen.sections.category.cancelEdit",
                                  )}
                                </Button>
                              </>
                            ) : categoryNameInput.trim() && !exactCategoryMatch ? (
                              <Button
                                className="rounded-lg"
                                onPress={() => {
                                  handleCreateOrUpdateCategory().catch(() => {
                                    // Errors are handled inside handleCreateOrUpdateCategory.
                                  });
                                }}
                              >
                                {t(
                                  "transactions:createScreen.sections.category.create",
                                  {
                                    name: categoryNameInput.trim(),
                                  },
                                )}
                              </Button>
                            ) : null}
                          </View>

                          {filteredCategories.length === 0 ? (
                            <EmptyState
                              compact
                              title={
                                categoriesForType.length === 0
                                  ? t(
                                      "transactions:createScreen.errors.noCategoriesTitle",
                                    )
                                  : t(
                                      "transactions:createScreen.sections.category.emptySearch",
                                    )
                              }
                              description={t(
                                "transactions:createScreen.errors.noCategoriesDescription",
                                {
                                  type: t(
                                    `transactions:createScreen.categoryKinds.${transactionType}`,
                                  ),
                                },
                              )}
                            />
                          ) : (
                            <View className="gap-3">
                              {filteredCategories.map((category) => (
                                <ManageCategoryCard
                                  key={category.local_id}
                                  category={category}
                                  isSelected={
                                    selectedCategoryLocalId === category.local_id
                                  }
                                  onSelect={() =>
                                    setSelectedCategoryLocalId(category.local_id)
                                  }
                                  onEdit={() => startCategoryEdit(category)}
                                  onDelete={() => {
                                    handleDeleteCategoryPress(category).catch(() => {
                                      // Errors are handled inside handleDeleteCategoryPress.
                                    });
                                  }}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      ) : categoriesForType.length === 0 ? (
                        <EmptyState
                          compact
                          title={t("transactions:createScreen.errors.noCategoriesTitle")}
                          description={t(
                            "transactions:createScreen.errors.noCategoriesDescription",
                            {
                              type: t(
                                `transactions:createScreen.categoryKinds.${transactionType}`,
                              ),
                            },
                          )}
                          action={
                            <Button onPress={() => setIsManagingCategories(true)}>
                              {t(
                                "transactions:createScreen.sections.category.toggleManage",
                              )}
                            </Button>
                          }
                        />
                      ) : (
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                          {categoriesForType.map((category) => (
                            <QuickCategoryCard
                              key={category.local_id}
                              category={category}
                              isSelected={
                                selectedCategoryLocalId === category.local_id
                              }
                              onPress={() =>
                                setSelectedCategoryLocalId(category.local_id)
                              }
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  <View className="rounded-lg bg-secondary px-5 py-5">
                    <View className="gap-1">
                      <Text className="text-[20px] font-bold leading-7 text-foreground">
                        {t("transactions:createScreen.sections.details.title")}
                      </Text>
                      <Text variant="muted">
                        {t("transactions:createScreen.sections.wallet.helper")}
                      </Text>
                    </View>

                    <View className="mt-5 gap-5">
                      <DetailLabelRow
                        icon={
                          <MaterialIcons
                            name={
                              selectedWalletVisuals?.iconName ??
                              "account-balance-wallet"
                            }
                            size={18}
                            color={selectedWalletVisuals?.iconColor ?? colors.accent}
                          />
                        }
                        label={t("transactions:createScreen.sections.wallet.title")}
                        value={selectedWallet?.name ?? "-"}
                      />

                      {wallets.length > 1 ? (
                        <ScrollView
                          horizontal
                          contentContainerStyle={{ gap: 12 }}
                          showsHorizontalScrollIndicator={false}
                        >
                          {wallets.map((wallet) => {
                            const isSelected =
                              selectedWalletLocalId === wallet.local_id;

                            return (
                              <Button
                                key={wallet.local_id}
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className="rounded-lg"
                                onPress={() => setSelectedWalletLocalId(wallet.local_id)}
                              >
                                {wallet.name}
                              </Button>
                            );
                          })}
                        </ScrollView>
                      ) : null}

                      <DetailLabelRow
                        icon={
                          <MaterialIcons
                            name="calendar-today"
                            size={16}
                            color={colors.mutedForeground}
                          />
                        }
                        label={t("transactions:createScreen.sections.date.title")}
                        value={formatDateLabel(dateValue)}
                      />

                      <DatePickerField
                        cancelLabel={t("common:actions.cancel")}
                        confirmLabel={t("common:actions.confirm")}
                        dialogTitle={t(
                          "transactions:createScreen.sections.date.title",
                        )}
                        onChange={(value) => {
                          setDateValue(toDateInputValue(value));
                        }}
                        placeholder={t(
                          "transactions:createScreen.sections.date.placeholder",
                        )}
                        className="rounded-lg border-0 bg-card"
                        value={dateInputValueToDate(dateValue)}
                      />

                      {showNoteField ? (
                        <Input
                          value={description}
                          onChangeText={setDescription}
                          placeholder={t(
                            "transactions:createScreen.sections.description.placeholder",
                          )}
                          className="rounded-lg border-0 bg-card"
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          className="justify-start rounded-lg bg-card"
                          textClassName="text-muted-foreground"
                          onPress={() => setShowNoteField(true)}
                        >
                          {t(
                            "transactions:createScreen.sections.description.placeholder",
                          )}
                        </Button>
                      )}
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View className="border-t border-border/40 bg-card px-5 py-4">
                <Button
                  fullWidth
                  variant="secondary"
                  className="mb-3"
                  disabled={!selectedWalletLocalId || !selectedCategoryLocalId}
                  onPress={() => {
                    handleSave("continue").catch(() => {
                      // Errors are handled inside handleSave.
                    });
                  }}
                >
                  {t("transactions:createScreen.sections.submit.actionAndContinue")}
                </Button>

                <Button
                  fullWidth
                  loading={isSaving}
                  disabled={!selectedWalletLocalId || !selectedCategoryLocalId}
                  onPress={() => {
                    handleSave("close").catch(() => {
                      // Errors are handled inside handleSave.
                    });
                  }}
                >
                  {t("transactions:createScreen.sections.submit.action")}
                </Button>
              </View>
            </>
          )}
        </>
      )}

      <AppAlertDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("common:actions.delete")}
        description={
          categoryDeleteSummary
            ? categoryDeleteSummary.transaction_count > 0
              ? t(
                  "transactions:createScreen.sections.category.deleteDescriptionWithUsage",
                  {
                    count: categoryDeleteSummary.transaction_count,
                    name: categoryDeleteSummary.category.name,
                  },
                )
              : t(
                  "transactions:createScreen.sections.category.deleteDescriptionNoUsage",
                  {
                    name: categoryDeleteSummary.category.name,
                  },
                )
            : ""
        }
        onCancel={() => setCategoryDeleteSummary(null)}
        onConfirm={() => {
          confirmDeleteCategory().catch(() => {
            // Errors are handled inside confirmDeleteCategory.
          });
        }}
        open={Boolean(categoryDeleteSummary)}
        title={t("transactions:createScreen.sections.category.deleteTitle")}
        tone="destructive"
      />
    </>
  );

  if (embedded) {
    return <View className="gap-6">{content}</View>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-background">
        <View className="border-b border-border/40 bg-background px-5 py-4">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-row items-center gap-4">
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-sm bg-secondary"
                onPress={() => router.back()}
              >
                <MaterialIcons name="close" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Text className="text-[20px] font-bold tracking-tight text-foreground">
                {t("transactions:createScreen.title")}
              </Text>
            </View>

            <View className="rounded-full bg-primary/10 px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-primary">
                {t("common:actions.new")}
              </Text>
            </View>
          </View>
        </View>
        {content}
      </View>
    </SafeAreaView>
  );
}
