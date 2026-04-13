---
title: Mapa de documentacion
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [docs, roadmap, architecture, conventions, rag]
summary: Explica como se organiza la documentacion viva de ProsferApp y cual es el orden recomendado para leerla y mantenerla.
---

# Documentacion de ProsferApp

## Objetivo de esta carpeta

`docs/` es la fuente de verdad para:

- alcance del producto
- etapas del proyecto
- arquitectura y datos
- convenciones de implementacion
- planes de trabajo

La documentacion debe ayudarnos a distinguir con claridad:

- lo implementado hoy
- lo preparado para el siguiente MVP
- lo planificado para mas adelante

## Orden de lectura recomendado

1. [`objective.md`](./objective.md)
2. [`mvp-roadmap.md`](./mvp-roadmap.md)
3. [`mvp1-budget-domain.md`](./mvp1-budget-domain.md)
4. [`project-context.md`](./project-context.md)
5. [`data-architecture.md`](./data-architecture.md)
6. [`conventions.md`](./conventions.md)
7. [`engineering-rules.md`](./engineering-rules.md)
8. [`rag-readiness.md`](./rag-readiness.md)
9. [`plans.md`](./plans.md)
10. [`agent-prompt.md`](./agent-prompt.md)

## Mapa de archivos

- [`objective.md`](./objective.md): vision, problema, propuesta de valor y alcance.
- [`mvp-roadmap.md`](./mvp-roadmap.md): define MVP 1, MVP 2, MVP 3 y lo que debe quedar preparado desde el dia cero.
- [`mvp1-budget-domain.md`](./mvp1-budget-domain.md): define el modelo de dominio y el flujo real del MVP 1 orientado a presupuesto mensual personal.
- [`project-context.md`](./project-context.md): contexto general del producto, stack actual y limites por dominio.
- [`data-architecture.md`](./data-architecture.md): explica SQLite, offline-first, sync futura y preparacion para MongoDB Atlas.
- [`conventions.md`](./conventions.md): naming, estructura, estilo de codigo, UI y documentacion.
- [`engineering-rules.md`](./engineering-rules.md): checklist corto para implementar sin desviarnos.
- [`rag-readiness.md`](./rag-readiness.md): reglas para que la documentacion sea facil de indexar y consultar con RAG.
- [`plans.md`](./plans.md): foco de trabajo actual y siguientes entregables.
- [`agent-prompt.md`](./agent-prompt.md): instrucciones operativas para agentes de IA que trabajen sobre este repo.
- [`adr/README.md`](./adr/README.md): como registrar decisiones tecnicas importantes.
- [`ux/README.md`](./ux/README.md): espacio reservado para futura documentacion de UX/UI.
- [`ux/mvp1-finance-ui.md`](./ux/mvp1-finance-ui.md): reglas visuales y de flujo para la UI del MVP 1 inspirada en Figma y optimizada para entender el plan mensual y registrar movimientos con pocos pasos.

## Reglas de mantenimiento

- Cada archivo debe tener una responsabilidad clara.
- Si una decision cambia arquitectura, datos, convenciones o alcance, debe quedar documentada.
- Si algo esta solo planificado, debe marcarse como `planned` o explicarse como propuesta.
- Si algo ya esta en codigo, la documentacion debe referenciarlo sin contradecirlo.
- Evitar mezclar en el mismo documento vision, roadmap, reglas y detalle tecnico.

## Criterio para crecer sin desorden

- Primero documentar la decision.
- Despues reflejarla en la estructura del codigo.
- Si la decision es importante y dificil de revertir, crear un ADR.
- Cuando llegue la documentacion de UX/UI, mantenerla en `docs/ux/` y enlazarla desde este mapa.
