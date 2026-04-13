---
title: Documentacion preparada para RAG
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [docs, rag, knowledge-base, retrieval]
summary: Define como escribir y organizar la documentacion para que en el futuro pueda indexarse y consultarse con RAG sin ambiguedad.
---

# Documentacion preparada para RAG

## Objetivo

Preparar la documentacion desde ahora para que en el futuro pueda usarse como base de conocimiento consultable por RAG sin tener que reescribir todo.

## Principios

- Un documento, un tema principal.
- Titulos explicitos y estables.
- Metadatos al inicio.
- Diferenciar con claridad lo implementado de lo planificado.
- Evitar mezclar producto, arquitectura, UX y decisiones tecnicas en el mismo archivo.
- Usar nombres canonicos y consistentes para entidades y conceptos.

## Metadata recomendada

Todos los docs nuevos deben incluir:

- `title`
- `status`
- `owner`
- `last_updated`
- `tags`
- `summary`

Esto ayuda a:

- filtrar por estado
- construir indices
- mejorar chunking
- reducir respuestas ambiguas

## Estructura recomendada por documento

Usar, cuando aplique, este orden:

1. Objetivo
2. Alcance
3. Reglas o decisiones
4. Estado actual
5. Limites o no alcance
6. Proximos pasos

## Plantilla sugerida

```md
---
title: Nombre del documento
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [tema-1, tema-2]
summary: Explica en una sola frase para que sirve este documento.
---

# Nombre del documento

## Objetivo

## Alcance

## Reglas o decisiones

## Estado actual

## Limites

## Proximos pasos
```

## Reglas de redaccion

- Nombrar siempre igual a las mismas entidades.
- Evitar sinonimos innecesarios para conceptos criticos.
- No usar frases vagas como "mas adelante veremos".
- Si algo es una propuesta, decirlo explicitamente.
- Si algo ya esta implementado, idealmente referenciar archivo o modulo relacionado.
- Mantener parrafos cortos y listas directas.

## Vocabulario canonico inicial

Usar estos terminos como base:

- `MVP 1`, `MVP 2`, `MVP 3`
- `offline-first`
- `local-first`
- `SQLite`
- `MongoDB Atlas`
- `sync`
- `owner_type`
- `owner_local_id`
- `wallets`
- `categories`
- `transactions`
- `sales`
- `purchases`
- `inventory_items`
- `stock_movements`
- `fidelizacion`

## Como documentar estados

- `active`: vigente y aplicable hoy
- `planned`: acordado para el futuro, todavia no implementado
- `draft`: en definicion
- `deprecated`: ya no deberia usarse

## Como evitar ruido para RAG

- No meter varios temas grandes en el mismo archivo.
- No repetir reglas iguales en diez documentos distintos.
- Cuando una regla sea canonica, enlazar al documento fuente.
- Crear ADRs para decisiones importantes en vez de esconderlas en conversaciones o commits.

## Fuentes que deberian poder indexarse mas adelante

- `docs/`
- futuros ADRs en `docs/adr/`
- futuros docs de UX/UI en `docs/ux/`
- migraciones de `src/database/schema/`
- tipos compartidos y contratos relevantes

## Siguiente nivel recomendado

Cuando el proyecto crezca un poco mas, conviene sumar:

- un diccionario de entidades
- un glosario de terminos de producto
- ADRs para sync, auth y modelo cloud
- docs de UX/UI separados por flujo
