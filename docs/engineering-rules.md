---
title: Engineering rules
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [engineering, implementation, architecture, mvp-1]
summary: Resume las reglas operativas para implementar sin salir del alcance actual ni romper la arquitectura base.
---

# Engineering rules

ProsferApp es una app mobile offline-first. La fase activa es `MVP 1: finanzas personales`.

## Alcance

- Construir primero para MVP 1: plan mensual personal, ingresos, gastos esenciales, deudas, metas, preferencias, wallets, categorias, transacciones y resumen del mes.
- Mantener visibles MVP 2 y MVP 3 en el modelado y la estructura, sin meter su complejidad funcional antes de tiempo.
- No tratar lo planificado como si ya estuviera implementado.

## Arquitectura

- La app escribe localmente primero.
- SQLite es la fuente operativa de verdad en el dispositivo.
- La nube es una extension futura para sync, backup y multi-dispositivo.
- Organizar por dominio en `src/features/<feature>/`.
- Centralizar helpers compartidos en `src/lib/`, `src/types/` y `src/components/ui/`.

## Datos

- El SQL crudo vive solo en repositorios o infraestructura de base de datos.
- Las pantallas no conocen SQL.
- Mantener `local_id`, `server_id`, `sync_status`, `version`, `created_at`, `updated_at` y `deleted_at` en entidades persistentes.
- Reutilizar `owner_type` y `owner_local_id` para ownership compartido.
- Persistir fechas como ISO 8601 y formatearlas en la capa de presentacion.

## UI

- Reutilizar `src/components/ui` antes de crear variantes aisladas.
- Mantener los flujos simples, claros y mobile-first.
- Evitar que la UI dependa de detalles internos de persistencia.
- La home del MVP 1 debe priorizar el estado del plan mensual antes que la lista de movimientos.
- No dejar colores, opacidades ni radios hardcodeados en pantallas de producto.
- Los colores deben salir de `src/lib/theme.ts` o de tokens semanticos del dominio.
- Los radios deben usar tokens compartidos basados en `--radius` y clases semanticas como `rounded-sm`, `rounded-lg` o `rounded-xl`.
- Cualquier shell de navegacion, modal o tab bar debe respetar `react-native-safe-area-context` de forma explicita.

## Documentacion

- Si una decision cambia arquitectura, roadmap o datos, actualizar `docs/`.
- Para cambios estructurales importantes, crear un ADR.
- Antes de documentar, diferenciar entre `active`, `planned` y `draft`.

## Lecturas obligatorias segun tarea

- Leer `docs/mvp-roadmap.md` para no salir del MVP correcto.
- Leer `docs/mvp1-budget-domain.md` si la tarea toca modelo de presupuesto, onboarding, resumen mensual o alertas.
- Leer `docs/data-architecture.md` si la tarea toca SQLite, sync o nube futura.
- Leer `docs/conventions.md` si la tarea agrega archivos, tipos, componentes o estructura.
- Leer `docs/ux/mvp1-finance-ui.md` si la tarea cambia pantallas o flujos del MVP 1.
- Leer `docs/rag-readiness.md` si la tarea crea o reorganiza documentacion.
