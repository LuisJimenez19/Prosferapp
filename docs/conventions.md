---
title: Convenciones del proyecto
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [conventions, coding, naming, structure, ui, docs]
summary: Reune las convenciones de naming, estructura, codigo, UI, datos y documentacion para mantener consistencia y legibilidad.
---

# Convenciones del proyecto

## Principios generales

- Priorizar legibilidad humana antes que abstraccion temprana.
- Reutilizar codigo cuando mejora consistencia y reduce errores.
- No sacrificar claridad por aplicar DRY de forma agresiva.
- Preferir modulos pequenos, con una sola responsabilidad reconocible.
- Hacer explicita la diferencia entre codigo actual y preparacion futura.

## Convenciones de naming

### Archivos y carpetas

- Usar `kebab-case` en archivos y carpetas.
- Mantener nombres cortos y ligados al dominio.
- Ejemplos validos:
  - `wallets-screen.tsx`
  - `wallet-form.tsx`
  - `wallet.repository.ts`
  - `personal-finance`

### Componentes, hooks y tipos

- Componentes React en `PascalCase`.
- Hooks en `camelCase` con prefijo `use`.
- Tipos e interfaces en `PascalCase`.
- Constantes globales en `UPPER_SNAKE_CASE`.

### Naming por tipo de modulo

- Pantallas: `<feature>-screen.tsx` o `<action>-modal-screen.tsx`
- Componentes de dominio: `<entity>-<purpose>.tsx`
- Repositorios: `<entity>.repository.ts`
- Servicios: `<entity>-<purpose>.ts`
- Helpers compartidos: nombre corto y directo en `src/lib`

### Base de datos

- Tablas y columnas en `snake_case`.
- Las estructuras que representan filas de SQLite pueden conservar `snake_case`.
- Las estructuras puramente de UI o dominio pueden usar `camelCase` si mejora la lectura, pero la conversion debe vivir en un mapper claro.

## Convenciones de estructura

### Rutas y aplicacion

- `app/` debe ocuparse de routing y composicion de pantallas.
- La logica de negocio no debe vivir en archivos de ruta.

### Features

- Cada dominio vive dentro de `src/features/<feature>/`.
- Una feature puede tener:
  - `screens/`
  - `components/`
  - `hooks/`
  - `services/`
  - `repositories/`
  - `types/`

### Compartido

- `src/components/ui/` para primitivas reutilizables.
- `src/database/` para cliente, queries, migraciones y seed.
- `src/lib/` para helpers puros reutilizables.
- `src/types/` para tipos compartidos.
- `docs/` para decisiones, roadmap y reglas.

## Convenciones de codigo

- Evitar `any` salvo causa justificada y documentada.
- Usar tipos explicitos cuando agregan significado.
- Mantener las funciones pequenas y con nombres descriptivos.
- Preferir mappers explicitos frente a transformaciones ocultas.
- Evitar utilidades genericas si todavia no existe un patron estable.
- Comentar solo cuando haga falta explicar el por que, no el que.

## Convenciones de reutilizacion

- Extraer a modulo compartido cuando una regla o pieza visual aparezca al menos dos veces y el concepto sea estable.
- No extraer demasiado pronto si el resultado hace mas dificil leer el flujo principal.
- Si la reutilizacion es solo visual, primero revisar `src/components/ui`.
- Si la reutilizacion es de dominio, extraer dentro de la feature.
- Si la reutilizacion cruza features, mover a `src/lib`, `src/types` o `src/components/ui` segun corresponda.

## Convenciones de datos y persistencia

- SQLite es la persistencia operativa local.
- El SQL crudo vive solo en `repositories/` o `src/database/`.
- Las pantallas no consultan SQLite directamente.
- Persistir timestamps como ISO 8601.
- Mantener metadata de sync en entidades persistentes.
- Usar soft delete con `deleted_at` en vez de borrar historico sin criterio.
- Respetar `owner_type` y `owner_local_id` como modelo comun de ownership.

## Convenciones de UI y componentes

- La UI debe ser simple, clara y orientada a tareas.
- Reutilizar primitivas de `src/components/ui` antes de crear variaciones locales.
- Los formularios deben separar presentacion y validacion cuando el flujo lo justifique.
- Evitar que la UI conozca detalles de SQL, migraciones o estructura interna de la base.
- Mantener consistencia visual primero; personalizacion despues.

## Convenciones de documentacion

- Cada documento debe tener un tema principal.
- Todos los docs nuevos deben incluir metadata al inicio.
- Usar titulos estables y faciles de buscar.
- Marcar siempre si algo esta `active`, `planned`, `draft` o `deprecated`.
- Si una decision tecnica es importante y dificil de revertir, crear un ADR.
- Si llega documentacion de UX/UI, ubicarla en `docs/ux/`.

## Checklist rapido antes de crear algo nuevo

1. Ya existe un modulo o patron compatible.
2. La nueva pieza pertenece a una feature o a compartido.
3. El naming refleja el dominio real y no la implementacion accidental.
4. La reutilizacion mejora claridad.
5. La decision necesita documentacion adicional.
