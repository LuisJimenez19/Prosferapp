---
title: Planes de trabajo
status: active
owner: product-engineering
last_updated: 2026-04-14
tags: [plans, execution, priorities]
summary: Resume el foco actual del proyecto y los siguientes entregables de producto y documentacion.
---

# Planes de trabajo

## Foco actual

Estamos consolidando la base del `MVP 1: finanzas personales` para que la app tenga:

- una estructura de datos estable
- un modelo claro de presupuesto mensual personal
- una lectura mas clara entre plan y ejecucion
- menor friccion de captura de actividad
- repositorios claros
- pantallas apoyadas sobre una base reutilizable
- documentacion suficiente para crecer sin desorden

## Prioridades activas

1. Reencuadrar MVP 1 alrededor del presupuesto mensual personal.
2. Estabilizar SQLite, migraciones y repositorios para plan, ingresos, deudas, metas y seguimiento.
3. Conectar wallets, categorias y transacciones como soporte de ejecucion del plan.
4. Fortalecer insights, estadisticas y avisos utiles para comparar plan vs realidad.
5. Definir backend readiness, sync y contratos de dominio sin romper el enfoque offline-first.
6. Mantener la navegacion y la UI base alineadas con el modelo de producto antes de sumar mas pantallas.
7. Documentar de forma que el siguiente MVP no obligue a reinterpretar todo.

## Entregables de documentacion que ya deben existir

- roadmap claro por MVP
- arquitectura de datos local y futura
- convenciones de naming y estructura
- reglas para documentacion preparada para RAG
- enfoque funcional de captura de actividad y seguimiento del plan
- documento puente para backend, sync y futura captura conversacional

## Proximos entregables recomendados

- mapa de pantallas del MVP 1
- ADR para estrategia de sync cloud
- diccionario de entidades del dominio
- contrato de integracion entre SQLite local y MongoDB Atlas
- backlog funcional de chatbot fase 1 para captura
- definicion de modulo de perfil personal, preferencias y notificaciones
- documentacion UX/UI en `docs/ux/`

## Regla de avance

- No sumar pantallas complejas si la base local todavia cambia demasiado.
- No introducir backend-first logic en tareas que hoy son puramente locales.
- No empujar chatbot, notificaciones o automatizaciones antes de fijar bien contratos de dominio y trazabilidad.
- Antes de abrir un nuevo frente, verificar si ya existe un documento que lo gobierna.
