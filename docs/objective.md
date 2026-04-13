---
title: Objetivo del proyecto
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [product, vision, scope, mvp]
summary: Define para que existe ProsferApp, que problema resuelve y cual es la direccion general del producto.
---

# Objetivo del proyecto

## Objetivo principal

Construir una aplicacion mobile offline-first que permita planificar, ejecutar y entender dinero personal o comercial de forma simple, confiable y escalable.

## Problema que resuelve

ProsferApp nace para personas y pequenos emprendedores que necesitan:

- transformar ingresos, gastos, deudas y metas en un plan claro
- registrar movimientos sin depender de conexion a internet
- entender rapidamente si van segun plan o se estan desviando
- evitar planillas desordenadas o apps rigidas
- empezar con algo simple hoy sin bloquear el crecimiento de manana

## Propuesta de valor

ProsferApp busca combinar:

- claridad de producto en torno a un plan concreto
- uso rapido y claro en el dia a dia
- persistencia local confiable
- estructura preparada para sincronizacion futura
- un modelo reutilizable para pasar de finanzas personales a negocio e inventario

## Vision de producto

La app empieza por finanzas personales, pero la vision completa es una plataforma modular que pueda cubrir:

- dinero personal
- presupuestos y metas
- negocios pequenos
- ventas y compras
- inventario
- reportes
- fidelizacion y ecosistema comercial en etapas posteriores

## Principios no negociables

- Offline-first desde el dia cero.
- SQLite como base local operativa en el dispositivo.
- Arquitectura modular por dominio.
- Datos preparados para sync futura y nube.
- Reutilizacion de codigo cuando mejora consistencia, nunca a costa de legibilidad.
- Documentacion clara antes de sumar complejidad.

## Alcance operativo actual

La prioridad real hoy es `MVP 1: finanzas personales`.

Eso implica construir una base solida para:

- plan mensual personal
- ingresos esperados
- gastos esenciales
- deudas
- metas de ahorro
- preferencias de presupuesto
- contexto personal
- wallets
- categorias
- transacciones
- resumen mensual y alertas simples
- configuracion minima

## Lo que debe quedar preparado desde el inicio

Aunque no todo se use en la primera version, la base tiene que contemplar:

- ownership compartido entre `personal` y `business`
- metadata de sync en entidades persistentes
- estructura de carpetas por dominio
- documentacion preparada para futuras consultas con RAG
- camino claro hacia MongoDB Atlas en la capa cloud

## Criterio de exito

Consideramos que la base del proyecto esta bien encaminada cuando:

- el MVP 1 genera y monitorea un plan mensual sin internet
- las transacciones alimentan el seguimiento del plan en vez de ser el producto completo
- el modelo local no obliga a reescribir todo para MVP 2 y MVP 3
- las decisiones tecnicas importantes estan documentadas
- una persona nueva puede entender el proyecto leyendo `docs/`
