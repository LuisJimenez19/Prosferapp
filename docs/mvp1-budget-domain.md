---
title: Modelo de dominio MVP 1 presupuesto personal
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [product, domain, mvp-1, budget, planning]
summary: Reordena MVP 1 alrededor de la generacion y seguimiento de un plan mensual personal donde las transacciones alimentan el monitoreo, pero no son el objetivo principal.
---

# Modelo de dominio MVP 1 presupuesto personal

## Regla de producto

En MVP 1, ProsferApp no se comporta como un simple tracker de movimientos.

El resultado principal que debe entregar es:

- un plan mensual personal claro
- seguimiento contra ese plan
- alertas simples cuando la ejecucion real se desvia

Las transacciones existen para alimentar el plan y medir ejecucion. No son el fin del producto.

## Resultado esperado para el usuario

Al terminar el onboarding del MVP 1, la persona deberia poder responder rapidamente:

- cuanto dinero espera recibir este mes
- cuanto necesita para gastos esenciales
- cuanto debe pagar de deudas
- cuanto quiere reservar para metas
- cuanto margen real le queda para gastar con tranquilidad

## Modelo de dominio propuesto

### 1. MonthlyBudgetPlan

Es el agregado principal del MVP 1.

Representa el plan mensual aprobado para una persona en un periodo puntual.

Campos recomendados:

- `local_id`, `server_id`, `owner_type`, `owner_local_id`
- `month_key` en formato `YYYY-MM`
- `currency_code`
- `status`: `draft | active | closed`
- `strategy_type`: `priority-based | zero-based | income-first`
- `planned_income_total`
- `planned_essential_total`
- `planned_debt_total`
- `planned_goal_total`
- `planned_flexible_total`
- `buffer_total`
- `generated_at`
- `created_at`, `updated_at`, `deleted_at`, `sync_status`, `version`

Recomendacion de implementacion:

- reutilizar `budgets` como base del agregado
- interpretar `budget_period = monthly`
- usar `start_date` y `end_date` como limites del mes activo
- tratar `amount_limit` como tope total del plan de salida
- agregar en una migracion futura solo los campos que hagan falta para no esconder logica importante en JSON

### 2. MonthlyIncomePlanItem

Representa cada fuente de ingreso esperada que alimenta el presupuesto del mes.

Campos recomendados:

- `local_id`
- `budget_local_id`
- `name`
- `expected_amount`
- `expected_day`
- `is_primary`
- `reliability_level`: `fixed | variable`
- metadata comun de sync y timestamps

Motivo:

- el presupuesto necesita ingreso esperado antes de que existan transacciones reales
- no conviene usar `transactions` para esto porque las transacciones son evidencia real, no expectativa

Implementacion recomendada:

- nueva tabla `budget_income_items`
- nuevo repositorio `src/features/personal-finance/repositories/budget-income.repository.ts`

### 3. EssentialExpensePlanItem

Representa cada gasto mensual que el plan considera necesario para sostener la vida financiera basica.

Campos recomendados:

- `local_id`
- `budget_local_id`
- `category_local_id`
- `allocated_amount`
- `priority_order`
- `is_fixed`
- `expected_day`
- metadata comun de sync y timestamps

Recomendacion de implementacion:

- reaprovechar `budget_categories` para la asignacion por categoria
- extender esa tabla mas adelante si realmente se necesita `priority_order`, `is_fixed` o `expected_day`

Regla funcional:

- lo esencial no se decide transaccion por transaccion
- se define una vez en el plan y luego se monitorea contra gastos reales

### 4. Debt

Representa una deuda activa que compite por el ingreso mensual.

Campos recomendados:

- `local_id`, `server_id`, `owner_type`, `owner_local_id`
- `name`
- `debt_type`: `credit_card | loan | family | other`
- `lender_name`
- `current_balance`
- `minimum_payment`
- `target_payment`
- `due_day`
- `interest_rate` opcional
- `priority_rank`
- `status`: `active | paused | closed`
- metadata comun de sync y timestamps

Motivo:

- una deuda no es una categoria ni una meta
- necesita identidad propia para seguimiento, alertas y estrategia

Implementacion recomendada:

- nueva tabla `debts`
- nuevo repositorio `src/features/personal-finance/repositories/debt.repository.ts`
- cuando una transaccion represente un pago de deuda, usar `reference_type = debt` y `reference_local_id = <debt_local_id>`

### 5. SavingsGoal

Representa una meta de ahorro o reserva.

La base actual ya tiene `goals` y `goal_contributions`.

Campos que ya sirven:

- `name`
- `target_amount`
- `current_amount`
- `target_date`
- `status`

Extensiones recomendadas para MVP 1 real:

- `priority_rank`
- `target_monthly_contribution`
- `is_flexible`

Implementacion recomendada:

- mantener `goals` como entidad principal de metas
- mantener `goal_contributions` para registrar aportes reales
- cuando una transaccion alimente una meta, usar `reference_type = goal` y `reference_local_id = <goal_local_id>`

### 6. BudgetPreferenceProfile

Representa como quiere decidir la persona cuando el ingreso no alcanza para todo.

Campos recomendados:

- `strategy_type`
- `buffer_mode`: `fixed_amount | percentage`
- `buffer_value`
- `prioritize_debt_over_goals`
- `allow_flexible_spending`
- `alert_threshold_percentage`
- `overspend_threshold_amount`
- `auto_assign_extra_income`

Implementacion recomendada:

- primera version: guardar JSON en `app_settings` con la key `personal_budget_preferences`
- cuando el contrato se estabilice, mover a tabla propia `budget_preferences`

Motivo:

- hoy necesitamos simplicidad
- no hace falta abrir una tabla dedicada si todavia estamos validando el modelo exacto de preferencias

### 7. MonthlyBudgetSummary

Es un read model derivado, no necesariamente una tabla en la primera version.

Debe resumir el estado del mes comparando plan vs ejecucion.

Campos recomendados:

- `month_key`
- `planned_income_total`
- `actual_income_total`
- `planned_essential_total`
- `actual_essential_total`
- `planned_debt_total`
- `actual_debt_total`
- `planned_goal_total`
- `actual_goal_total`
- `planned_flexible_total`
- `actual_flexible_total`
- `buffer_total`
- `remaining_to_assign`
- `deviation_status`
- `alert_count`

Implementacion recomendada:

- construirlo en un servicio como `budget-summary.ts`
- recalcularlo localmente desde SQLite cada vez que cambia el plan o se agrega una transaccion
- no persistirlo como tabla hasta que aparezca una necesidad real de performance o historial de snapshots

## Como conectar esto con las entidades actuales

### Wallets

`wallets` siguen siendo importantes, pero con un rol claro:

- muestran donde vive el dinero real
- participan en las transacciones reales
- no definen por si solas la estrategia presupuestaria

Regla:

- wallet no es bucket de presupuesto
- wallet es cuenta operativa

### Categories

`categories` deben pasar a ser el puente entre plan y ejecucion.

El cambio recomendado no es arquitectonico, sino semantico:

- hoy clasifican ingresos y egresos
- en MVP 1 deben tambien indicar como esa categoria impacta el plan

Metadata recomendada para categoria:

- `budget_role`: `income | essential | debt_payment | goal_contribution | flexible | ignore`
- `is_essential`
- `default_goal_local_id`
- `default_debt_local_id`

Implementacion recomendada:

- agregar columnas a `categories` en una migracion futura
- evitar crear una segunda tabla de clasificacion si no es estrictamente necesaria

### Transactions

`transactions` pasan a ser eventos de ejecucion.

Sirven para responder:

- lo planificado realmente ocurrio
- se gasto mas o menos de lo esperado
- se pago una deuda
- se aporto a una meta

Conexion recomendada:

- usar `category_local_id` para ubicar el bucket del plan
- usar `reference_type` y `reference_local_id` cuando haga falta vincular la transaccion a una deuda o meta concreta
- mantener `wallet_local_id` como cuenta donde ocurrio el movimiento

## Recomendacion de implementacion sin alterar la arquitectura

Mantener todo dentro de la arquitectura actual:

- nuevas migraciones en `src/database/schema/`
- nuevos tipos en `src/features/personal-finance/types/`
- nuevos repositorios en `src/features/personal-finance/repositories/`
- logica de generacion y monitoreo en `src/features/personal-finance/services/`
- UI futura consumiendo servicios y repositorios, no SQL

Modulos recomendados:

- `budget-plan.repository.ts`
- `budget-income.repository.ts`
- `debt.repository.ts`
- `budget-generator.ts`
- `budget-summary.ts`
- `budget-alerts.ts`

Regla:

- no abrir un nuevo dominio para esto
- mientras el ownership sea `personal`, todo queda dentro de `personal-finance`

## Flujo ideal de usuario para MVP 1

### 1. Onboarding

Objetivo:

- capturar lo minimo necesario para generar el primer plan

Orden recomendado:

1. contexto personal y moneda principal
2. ingreso mensual esperado
3. gastos esenciales base
4. deudas activas
5. metas de ahorro
6. prioridad o estrategia

Principio UX:

- cada paso debe pedir solo lo necesario para calcular el plan
- si algo puede inferirse despues, no pedirlo al inicio

### 2. Goal and Debt Setup

Debe ocurrir como parte del armado del plan, no como una configuracion separada demasiado larga.

Regla:

- primero cargar deudas activas con pago minimo
- despues metas con prioridad simple
- evitar pedir configuracion avanzada de intereses o escenarios complejos si no es imprescindible

### 3. Budget Generation

La app toma:

- ingresos esperados
- gastos esenciales
- deudas
- metas
- preferencias

Y devuelve:

- cuanto debe ir a esenciales
- cuanto debe ir a deudas
- cuanto puede ir a metas
- cuanto queda flexible
- si el plan es viable o necesita ajuste

Salida recomendada:

- un unico resumen mensual claro
- lista corta de ajustes sugeridos si el ingreso no alcanza

### 4. Transaction Tracking Against the Plan

Una vez aprobado el plan:

- el usuario registra movimientos reales
- cada movimiento impacta el seguimiento mensual
- la home debe mostrar primero plan vs real, y despues wallets o movimientos recientes

Regla:

- registrar transacciones debe seguir siendo rapido
- pero la lectura principal ya no es el movimiento en si, sino el desvio frente al plan

### 5. Alerts When the User Deviates

En MVP 1 conviene mantener alertas simples y locales.

Alertas minimas:

- gasto esencial excedido
- pago minimo de deuda en riesgo
- aporte a meta por debajo de lo esperado
- gasto flexible consumiendo el margen del mes

Implementacion recomendada:

- derivarlas localmente en `budget-alerts.ts`
- mostrarlas en home y en el resumen mensual
- no depender de push notifications ni backend en esta etapa

## Reglas para no mezclar MVP 2 y MVP 3

- `business`, `sales`, `purchases` e `inventory` no participan del dominio de presupuesto personal de MVP 1
- mantener `owner_type` y `owner_local_id` para compatibilidad futura
- no reutilizar ventas o inventario como si fueran movimientos personales
- cuando llegue MVP 2, se podra crear un modelo de presupuesto de negocio separado si hace falta

## Decision practica para la siguiente etapa

Antes de seguir agregando UI, conviene hacer en este orden:

1. definir tipos y contratos del presupuesto mensual
2. agregar migraciones minimas para `budget_income_items` y `debts`
3. extender `categories` con metadata presupuestaria
4. crear servicios de `budget-generator`, `budget-summary` y `budget-alerts`
5. despues recien redisenar la home y el onboarding alrededor del plan
