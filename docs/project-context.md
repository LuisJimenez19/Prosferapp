---
title: Contexto general del proyecto
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [product, architecture, stack, domains]
summary: Resume el contexto del producto, el stack actual del repo y la separacion por dominios con la que debe crecer ProsferApp.
---

# Contexto general del proyecto

## Resumen

ProsferApp es una aplicacion mobile construida con React Native y Expo que empieza por finanzas personales, pero se diseña desde el inicio para crecer hacia gestion de negocio, inventario y funciones de ecosistema.

En el MVP 1, la propuesta concreta no es solo registrar movimientos: es generar y monitorear un plan mensual personal.

La idea central es simple:

- el dispositivo trabaja localmente primero
- SQLite sostiene la operacion local
- la nube llegara despues para sync, backup, multi-dispositivo y funciones ampliadas

## Estado actual del repo

### Stack implementado hoy

- React Native
- Expo SDK 54
- TypeScript
- Expo Router
- NativeWind
- Expo SQLite
- i18n con `i18next` y `react-i18next`

### Stack planificado para etapas futuras

- persistencia cloud en MongoDB Atlas
- capa de sync y reconciliacion
- servicios backend en un repositorio o modulo separado cuando corresponda
- notificaciones y mas integraciones

Importante:

- MongoDB Atlas esta decidido como direccion de nube.
- El backend concreto todavia no forma parte de este repo.
- No debemos documentar tecnologia futura como si ya estuviera implementada.

## Principios de arquitectura

- Offline-first.
- Escritura local primero, sync despues.
- Separacion clara entre finanzas, operacion comercial e inventario.
- Modelo de ownership reutilizable para `personal` y `business`.
- Crecimiento modular por dominio, no por pantallas aisladas.

## Dominios principales

- `personal-finance`
- `settings`
- `businesses` en preparacion
- `sales` en preparacion
- `purchases` en preparacion
- `inventory` en preparacion
- `sync` como capacidad transversal futura
- `fidelizacion` y ecosistema como etapa posterior

## Mapa de capas

La app debe mantenerse en capas simples:

1. `app/`
   Define rutas y composicion de navegacion.
2. `src/features/<feature>/screens`
   Orquesta la experiencia de una pantalla.
3. `src/features/<feature>/components`
   Reutiliza piezas visuales del dominio.
4. `src/features/<feature>/services`
   Encapsula reglas de formulario, transformaciones y logica de aplicacion.
5. `src/features/<feature>/repositories`
   Contiene acceso a datos y SQL del dominio.
6. `src/database`
   Infraestructura SQLite, queries compartidas, migraciones y seed.
7. `src/components/ui`
   Primitivas visuales reutilizables.
8. `src/lib`
   Helpers transversales puros.

## Estructura actual relevante

```text
app/
docs/
src/
  components/ui/
  database/
    schema/
  features/
    personal-finance/
    settings/
  i18n/
  lib/
  types/
```

## Regla de separacion por dominio

- `transactions` representan movimientos financieros ejecutados.
- `budgets`, `debts` y `goals` representan planificacion personal.
- `sales` y `purchases` representan operaciones comerciales.
- `stock_movements` representan cambios de inventario.

Aunque estos dominios se relacionen, no deben colapsarse en una sola entidad gigante.

## Preparado para el crecimiento

La base ya contempla:

- migraciones por etapas
- tablas reservadas para negocio e inventario
- metadata de sync compartida
- ownership comun
- carpeta `docs/` estructurada para soportar RAG y decisiones futuras

## Fuera de alcance por ahora

Mientras el foco siga siendo MVP 1, no se debe introducir como centro del desarrollo:

- backend-first design
- fidelizacion operativa
- red comercial
- reportes complejos
- automatizaciones de notificaciones
- UI avanzada antes de fijar bien el modelo de presupuesto personal
