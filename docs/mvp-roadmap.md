---
title: Roadmap de MVPs
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [product, roadmap, mvp-1, mvp-2, mvp-3]
summary: Define las etapas del proyecto y las bases transversales que deben existir desde el inicio aunque no todas se usen en la primera version.
---

# Roadmap de MVPs

## Regla principal

Cada MVP agrega capacidad de producto, pero no deberia obligar a rehacer la base tecnica. Por eso desde el inicio dejamos preparadas ciertas decisiones estructurales aunque todavia no expongamos toda la funcionalidad.

## Bases transversales desde el dia cero

| Base | Por que existe desde el inicio | Se usa fuerte en |
| --- | --- | --- |
| `owner_type` + `owner_local_id` | Evita duplicar modelos personales y de negocio | MVP 1, MVP 2, MVP 3 |
| `local_id`, `server_id`, `sync_status`, `version` | Prepara sync y nube sin redisenar entidades | MVP 1 en adelante |
| `deleted_at` | Permite soft delete y reconciliacion futura | MVP 1 en adelante |
| `sync_queue` | Reserva el lugar para sincronizacion robusta | MVP 2+ |
| `src/features/<feature>` | Facilita crecimiento por dominio | Todos |
| `src/components/ui` | Mantiene consistencia visual y reutilizacion | Todos |
| documentacion con metadata | Facilita mantenimiento y futuro RAG | Todos |

## MVP 1: Finanzas personales

### Objetivo

Generar y monitorear un plan mensual personal basado en ingresos, gastos esenciales, deudas, metas y prioridades, usando transacciones reales como seguimiento de ejecucion.

### Incluye

- onboarding minimo para armar el primer plan
- generacion de presupuesto mensual personal
- resumen mensual con lectura plan vs real
- alertas locales simples por desvio
- ingresos esperados
- gastos esenciales
- deudas
- metas de ahorro
- preferencias o estrategia de presupuesto
- wallets
- categorias
- transacciones
- contexto personal
- configuracion minima

### Puede quedar modelado aunque no expuesto completo

- budget income items
- budgets
- debts
- goals
- goal contributions
- sync queue

### No incluye como foco de producto

- tracking de movimientos como objetivo principal
- negocios
- clientes y proveedores
- ventas y compras
- inventario
- fidelizacion
- backend cloud operativo

### Definicion de listo

- la app funciona offline para el flujo principal
- el usuario puede armar un plan mensual personal con pocos pasos
- el resumen del mes compara plan vs ejecucion real
- las transacciones funcionan como insumo del seguimiento
- SQLite soporta las entidades del MVP 1 sin SQL disperso en pantallas
- la navegacion y la UI base son coherentes
- la estructura ya deja espacio limpio para negocio e inventario

## MVP 2: Gestion de negocio

### Objetivo

Sumar contexto de negocio sin romper la separacion entre vida personal y operacion comercial.

### Incluye

- businesses
- customers
- suppliers
- products
- services
- sales
- purchases

### Depende de que ya este firme desde MVP 1

- ownership compartido
- metadata de sync
- transacciones separadas de ventas y compras
- modulos por dominio

### Definicion de listo

- una persona puede operar finanzas personales y negocio sin mezclar contextos
- ventas y compras tienen su propio modelo y trazabilidad
- la base queda preparada para inventario sin redisenar ventas

## MVP 3: Inventario

### Objetivo

Agregar visibilidad operativa sobre stock sin degradar el rendimiento ni mezclar inventario con movimientos financieros.

### Incluye

- inventory_items como snapshot actual
- stock_movements como historia
- trazabilidad por producto y fuente

### Depende de que ya exista

- productos estables
- compras y ventas identificables
- snapshots historicos en line items y movimientos

### Definicion de listo

- el stock se puede explicar con historial
- cada movimiento tiene fuente y contexto
- reportes basicos pueden cruzar inventario con operacion comercial

## Post-MVP y ecosistema

Estas capacidades quedan fuera del alcance inmediato, pero la base actual debe dejarles espacio:

- sync con nube y soporte multi-dispositivo
- reportes mas avanzados
- backup y recuperacion
- notificaciones
- fidelizacion y recompensas entre negocios
- red comercial y funciones de ecosistema

## Nota sobre fidelizacion

La fidelizacion no se implementa en MVP 1. Requiere antes:

- identidad estable de usuario y negocio
- historial confiable de ventas y compras
- sync cloud razonablemente madura
- reglas claras sobre ownership y eventos

Por eso se deja preparada la base de datos y la arquitectura, pero no la logica de producto todavia.
