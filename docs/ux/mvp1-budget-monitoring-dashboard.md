---
title: Dashboard y monitoreo del plan mensual
status: active
owner: product-engineering
last_updated: 2026-04-13
tags: [ux, dashboard, budget, monitoring, diagrams, mvp-1]
summary: Documenta como home y dashboard leen el estado del mes, que reglas de consistencia deben respetar y cuales son los flujos clave para monitoreo y accion guiada.
---

# Dashboard y monitoreo del plan mensual

## Objetivo

El home y el dashboard deben contar la misma historia del mes.

La diferencia entre ambos no es la logica, sino el nivel de profundidad:

- `home` da una lectura rapida, alertas y accesos de accion
- `dashboard` explica con mas detalle donde se produjo un desvio y como se reparte el mes

## Fuente de verdad

Ambas pantallas consumen el mismo resumen derivado:

- `budgetSummaryService.getCurrentMonthlyBudgetOverview`

Archivos clave:

- `src/features/personal-finance/services/budget-summary.service.ts`
- `src/features/personal-finance/hooks/use-home-screen.ts`
- `src/features/personal-finance/hooks/use-dashboard-screen.ts`

## Regla de consistencia

La lectura de estado del plan sigue estas reglas:

- `off_track`: cuando esenciales o flexible superan lo planificado
- `warning`: cuando deudas o metas van por debajo del objetivo mensual
- `on_track`: cuando no hay exceso en caps ni faltantes en targets

Regla UX:

- nunca mostrar "te quedan {{amount}} antes de salirte del plan" si el estado ya es `off_track`
- cuando el desvio ya ocurrio, la lectura rapida debe decir en que bloque paso
- el dashboard debe usar el mismo estado que home y solo profundizar el por que

## Lectura de los graficos

### Dona de esenciales

- muestra la distribucion real por categoria esencial
- si aun no hay movimientos reales, toma el plan como referencia
- el centro muestra el total actualmente visualizado
- el detalle inferior confirma categoria, monto, porcentaje y desvio

### Dona de bloques

- compara como se reparte el mes entre esenciales, deudas, metas y flexible
- si todavia no hay ejecucion real, usa los montos planificados
- ayuda a ver rapido si el mes esta cargado en gasto base, deuda, ahorro o margen libre

## Diagrama de flujo

```mermaid
flowchart TD
    A[Usuario crea o ajusta plan mensual] --> B[Prosfer guarda ingresos esenciales deudas metas y preferencias]
    B --> C[Budget summary recalcula plan vs ejecucion]
    C --> D[Home muestra estado rapido]
    C --> E[Dashboard muestra detalle por bloque y por esencial]
    D --> F{Hay desvio?}
    E --> F
    F -- No --> G[Usuario sigue registrando movimientos]
    F -- Si --> H[Usuario abre dashboard o plan mensual]
    H --> I[Prosfer explica bloque afectado]
    I --> J[Usuario ajusta plan o registra transaccion guiada]
    J --> C
    G --> C
```

## Diagrama de casos de uso

```mermaid
flowchart LR
    U[Usuario]
    HM((Ver estado rapido en home))
    DB((Abrir dashboard del mes))
    BD((Entender desvio por bloque))
    BE((Entender desvio por esencial))
    GP((Registrar transaccion guiada))
    AP((Actualizar plan mensual))
    FT((Filtrar historial de movimientos))

    U --> HM
    U --> DB
    U --> GP
    U --> AP
    U --> FT

    DB --> BD
    DB --> BE
    GP --> BD
    AP --> HM
    AP --> DB
```

## Checklist de mantenimiento

- si cambia la logica de `deviation_status`, actualizar home y dashboard en el mismo cambio
- si cambia un grafico, revisar tambien los textos que explican ese grafico
- si se agregan nuevos bloques al plan, actualizar:
  - `BudgetComparisonBlock`
  - summary service
  - dashboard
  - documentacion de este archivo
- si aparece un nuevo flujo guiado, reflejarlo en los diagramas
