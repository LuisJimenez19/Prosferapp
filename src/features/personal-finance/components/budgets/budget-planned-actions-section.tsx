import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  UIManager,
  View,
} from "react-native";

import {
  Button,
  Card,
  CardContent,
  DatePickerField,
  EmptyState,
  Input,
  Text,
} from "@/src/components/ui";
import { useBudgetPlannedActions } from "@/src/features/personal-finance/hooks/use-budget-planned-actions";
import type { BudgetPlannedAction } from "@/src/features/personal-finance/types/budget-actions";
import {
  dateInputValueToDate,
  formatDateLabel,
  toDateInputValue,
} from "@/src/lib/dates";
import { formatCurrency } from "@/src/lib/money";

type BudgetPlannedActionsSectionProps = {
  isFocused: boolean;
  onGoToPlan: () => void;
  refreshKey?: number;
};

function getActionBadge(action: BudgetPlannedAction) {
  if (action.status === "recorded") {
    return {
      containerClassName: "bg-primary/10",
      textClassName: "text-primary",
      label: "Registrado",
    };
  }

  if (action.status === "scheduled") {
    return {
      containerClassName: "bg-secondary",
      textClassName: "text-foreground",
      label: "Programado",
    };
  }

  return {
    containerClassName: "bg-amber-500/15",
    textClassName: "text-amber-600 dark:text-amber-300",
    label: "Listo para registrar",
  };
}

function getKindLabel(action: BudgetPlannedAction) {
  switch (action.kind) {
    case "income":
      return "Ingreso";
    case "essential":
      return "Esencial";
    case "debt":
      return "Deuda";
    case "goal":
      return "Meta";
    default:
      return "Movimiento";
  }
}

export function BudgetPlannedActionsSection({
  isFocused,
  onGoToPlan,
  refreshKey = 0,
}: BudgetPlannedActionsSectionProps) {
  const [recentlyRecordedActionTitle, setRecentlyRecordedActionTitle] =
    useState<string | null>(null);
  const {
    acknowledgedActionIds,
    confirmAction,
    currencyCode,
    error,
    hasBudget,
    isConfirmingActionId,
    isLoading,
    noteByActionId,
    plannedActions,
    selectedDateByActionId,
    selectedWalletByActionId,
    setActionAcknowledged,
    setActionNote,
    setSelectedDate,
    setSelectedWallet,
    summary,
    wallets,
  } = useBudgetPlannedActions(isFocused, refreshKey);
  const nextPendingAction = useMemo(
    () =>
      plannedActions.find((action) => action.status !== "recorded") ?? null,
    [plannedActions],
  );

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="items-center gap-3 py-8">
          <ActivityIndicator size="small" />
          <Text variant="muted">Preparando movimientos del plan...</Text>
        </CardContent>
      </Card>
    );
  }

  if (!hasBudget) {
    return (
      <EmptyState
        compact
        title="Primero genera tu plan mensual"
        description="Los movimientos guiados salen del plan actual. Cuando tengas el plan listo, desde aqui podras registrar ingresos, esenciales, deudas y metas sin repetir carga manual."
        action={<Button onPress={onGoToPlan}>Ir al plan</Button>}
      />
    );
  }

  return (
    <View className="gap-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="gap-3 py-4">
          <View className="gap-1">
            <Text weight="semibold" className="text-primary">
              Registro guiado del mes
            </Text>
            <Text variant="muted">
              Cada movimiento se prepara con categoria, monto y referencia. Tu
              solo confirmas cuando realmente ocurrio para no inflar el plan con
              transacciones ficticias.
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="rounded-full bg-card px-3 py-2">
              <Text className="text-xs font-semibold text-foreground">
                Pendientes ahora: {summary.ready_count}
              </Text>
            </View>
            <View className="rounded-full bg-card px-3 py-2">
              <Text className="text-xs font-semibold text-foreground">
                Programados: {summary.scheduled_count}
              </Text>
            </View>
            <View className="rounded-full bg-card px-3 py-2">
              <Text className="text-xs font-semibold text-foreground">
                Registrados: {summary.recorded_count}
              </Text>
            </View>
            <View className="rounded-full bg-card px-3 py-2">
              <Text className="text-xs font-semibold text-foreground">
                Pendiente total:{" "}
                {formatCurrency(summary.pending_total_amount, currencyCode)}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="gap-2">
            <Text weight="semibold" className="text-destructive">
              No pudimos preparar los movimientos
            </Text>
            <Text variant="muted" className="text-destructive/80">
              {error}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      {recentlyRecordedActionTitle ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="gap-2 py-4">
            <Text weight="semibold" className="text-primary">
              Movimiento registrado
            </Text>
            <Text variant="muted">
              Registramos {recentlyRecordedActionTitle}.{" "}
              {nextPendingAction
                ? `Abajo ya quedo listo el siguiente: ${nextPendingAction.title}.`
                : "Ya no quedan movimientos pendientes por este mes."}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      {plannedActions.length === 0 ? (
        <EmptyState
          compact
          title="No hay movimientos listos"
          description="Todavia no encontramos ingresos, esenciales, deudas o metas pendientes para este mes."
        />
      ) : null}

      {plannedActions.map((action) => {
        const badge = getActionBadge(action);
        const selectedWalletLocalId =
          selectedWalletByActionId[action.id] ?? null;
        const selectedDate =
          selectedDateByActionId[action.id] ?? action.default_date;
        const isAcknowledged = Boolean(acknowledgedActionIds[action.id]);
        const isSaving = isConfirmingActionId === action.id;
        const isNextSuggested =
          nextPendingAction?.id === action.id && action.status !== "recorded";

        return (
          <Card key={action.id}>
            <CardContent className="gap-4 py-5">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text weight="semibold">{action.title}</Text>
                    <View className="rounded-full bg-secondary px-2 py-1">
                      <Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-muted-foreground">
                        {getKindLabel(action)}
                      </Text>
                    </View>
                    {isNextSuggested ? (
                      <View className="rounded-full bg-primary/10 px-2 py-1">
                        <Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-primary">
                          Siguiente
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="muted">{action.description}</Text>
                </View>
                <View className="items-end gap-2">
                  <View
                    className={`rounded-full px-3 py-1.5 ${badge.containerClassName}`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase tracking-[0.8px] ${badge.textClassName}`}
                    >
                      {badge.label}
                    </Text>
                  </View>
                  <Text weight="semibold">
                    {formatCurrency(
                      action.kind === "income" ? action.amount : -action.amount,
                      currencyCode,
                    )}
                  </Text>
                </View>
              </View>

              <View className="gap-1 rounded-lg bg-secondary px-4 py-4">
                <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted-foreground">
                  Categoria
                </Text>
                <Text>{action.category_name}</Text>
              </View>

              {action.status === "recorded" ? (
                <View className="gap-2 rounded-lg bg-secondary px-4 py-4">
                  <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted-foreground">
                    Ya registrado
                  </Text>
                  <Text>
                    Se registro el{" "}
                    {formatDateLabel(action.recorded_at ?? action.default_date)}
                    {action.recorded_wallet_name
                      ? ` en ${action.recorded_wallet_name}.`
                      : "."}
                  </Text>
                </View>
              ) : (
                <>
                  <View className="gap-2">
                    <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted-foreground">
                      Billetera
                    </Text>
                    {wallets.length > 0 ? (
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
                              onPress={() =>
                                setSelectedWallet(action.id, wallet.local_id)
                              }
                            >
                              {wallet.name}
                            </Button>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <Text variant="muted">
                        Necesitas al menos una billetera para registrar este
                        movimiento.
                      </Text>
                    )}
                  </View>

                  <View className="gap-2">
                    <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted-foreground">
                      Fecha a registrar
                    </Text>
                    <DatePickerField
                      cancelLabel="Cancelar"
                      confirmLabel="Confirmar"
                      dialogTitle="Fecha del movimiento"
                      onChange={(nextDate) => {
                        setSelectedDate(action.id, toDateInputValue(nextDate));
                      }}
                      placeholder="Selecciona una fecha"
                      className="rounded-lg border-border/40 bg-card"
                      value={dateInputValueToDate(selectedDate)}
                    />
                    {action.scheduled_date ? (
                      <Text variant="muted">
                        Fecha sugerida del plan:{" "}
                        {formatDateLabel(action.scheduled_date)}.
                      </Text>
                    ) : (
                      <Text variant="muted">
                        Este movimiento no tenia un dia fijo. Puedes registrar
                        la fecha real ahora.
                      </Text>
                    )}
                  </View>

                  <View className="gap-2">
                    <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted-foreground">
                      Nota
                    </Text>
                    <Input
                      value={noteByActionId[action.id] ?? action.default_note}
                      onChangeText={(value) => setActionNote(action.id, value)}
                      placeholder="Agregar nota"
                      className="rounded-lg border-border/40 bg-card"
                    />
                  </View>

                  <Pressable
                    className={[
                      "rounded-lg border px-4 py-4",
                      isAcknowledged
                        ? "border-primary bg-primary/10"
                        : "border-border/40 bg-secondary",
                    ].join(" ")}
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      );
                      setRecentlyRecordedActionTitle(null);
                      setActionAcknowledged(action.id, !isAcknowledged);
                    }}
                  >
                    <View className="flex-row items-start gap-3">
                      <View className="pt-0.5">
                        <MaterialIcons
                          color={isAcknowledged ? "#3b82f6" : "#9ca3af"}
                          name={
                            isAcknowledged
                              ? "check-circle"
                              : "radio-button-unchecked"
                          }
                          size={20}
                        />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-muted-foreground">
                          Paso 1
                        </Text>
                        <Text weight="semibold">
                          {isAcknowledged
                            ? "Confirmaste que este movimiento ya ocurrio."
                            : "Toca aqui para confirmar que este movimiento ya ocurrio."}
                        </Text>
                        <Text variant="muted">
                          {isAcknowledged
                            ? "El boton de registro ya quedo habilitado."
                            : "Hasta que no lo confirmes, no dejamos registrarlo para evitar inflar el plan."}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {!isAcknowledged ? (
                    <Text variant="muted">
                      Paso 2: una vez confirmado el paso anterior, se habilita el
                      boton para registrar {getKindLabel(action).toLowerCase()}.
                    </Text>
                  ) : null}

                  <Button
                    fullWidth
                    loading={isSaving}
                    disabled={!selectedWalletLocalId || !isAcknowledged}
                    onPress={async () => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      );
                      try {
                        await confirmAction(action.id);
                        setRecentlyRecordedActionTitle(action.title);
                      } catch {
                        // The hook already exposes the error state.
                      }
                    }}
                  >
                    {`Paso 2: registrar ${getKindLabel(action).toLowerCase()}`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </View>
  );
}
