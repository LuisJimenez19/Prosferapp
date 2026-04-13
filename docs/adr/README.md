---
title: ADRs
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [adr, architecture, decisions]
summary: Explica cuando registrar una decision tecnica como ADR y propone una plantilla base.
---

# ADRs

## Para que sirve esta carpeta

`docs/adr/` guarda Architecture Decision Records para decisiones que:

- son importantes
- afectan varias partes del sistema
- son dificiles de revertir
- conviene poder consultar en el futuro

## Cuando crear un ADR

Crear un ADR cuando decidamos algo como:

- estrategia de sync
- contrato entre SQLite y MongoDB Atlas
- autenticacion y manejo de sesiones
- organizacion fuerte de dominios
- cambios grandes en UI foundation o arquitectura

## Plantilla sugerida

```md
---
title: ADR-000 Nombre corto
status: proposed
owner: product-engineering
last_updated: 2026-04-09
tags: [adr, tema]
summary: Decision corta explicada en una frase.
---

# ADR-000 Nombre corto

## Contexto

## Decision

## Consecuencias

## Alternativas consideradas

## Estado
```

## Regla practica

Si una decision importante solo vive en chat, ticket o commit, todavia no esta bien documentada.
