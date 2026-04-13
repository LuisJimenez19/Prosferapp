---
title: Arquitectura de datos
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [data, sqlite, offline-first, sync, mongodb-atlas]
summary: Explica que datos se guardan en SQLite, por que se guardan ahi y como esa base local prepara la evolucion futura hacia MongoDB Atlas y sincronizacion cloud.
---

# Arquitectura de datos

## Objetivo

Definir una arquitectura de datos que funcione muy bien offline hoy y que no obligue a redisenar el producto cuando llegue la nube.

## Principios

- Local-first: la app escribe y lee localmente primero.
- Offline-first: el flujo principal no depende de internet.
- Ownership compartido: una entidad puede pertenecer a `personal` o `business`.
- Sync-ready: la metadata necesaria existe desde el inicio.
- Evolucion por etapas: el modelo contempla MVP 2 y MVP 3 sin obligar a habilitarlos ya.

## Referencias actuales de codigo

La documentacion de datos se apoya en estas piezas reales del repo:

- `src/database/schema/001_base.ts`
- `src/database/schema/002_business.ts`
- `src/database/schema/003_inventory.ts`
- `src/database/runMigrations.ts`
- `src/database/seedInitialData.ts`
- `src/types/common.ts`

## Por que SQLite es la base local actual

SQLite se usa porque:

- vive dentro del dispositivo y funciona sin red
- es simple de operar en mobile
- soporta transacciones y consistencia local
- permite migraciones ordenadas
- encaja muy bien con formularios, listados y estado persistente del dia a dia

En esta etapa, SQLite es la fuente operativa de verdad dentro del dispositivo.

## Que datos se guardan en SQLite y por que

### Entidades activas o necesarias para MVP 1

| Grupo | Tablas | Por que viven en SQLite | Como ayudan despues |
| --- | --- | --- | --- |
| identidad local | `users`, `personal_profiles`, `app_settings` | permiten arrancar la app, guardar contexto activo y defaults | facilitan mapear usuario local con identidad cloud y preferencias persistentes |
| ejecucion financiera | `wallets`, `categories`, `transactions` | registran donde vive el dinero y que paso en la realidad | alimentan el seguimiento del plan mensual |
| planificacion personal | `budgets`, `budget_categories`, `goals`, `goal_contributions` | forman la base del dominio de presupuesto personal | reducen retrabajo cuando se habilite toda la UX del plan |
| sincronizacion local | `sync_queue` | reserva la cola local para operaciones pendientes | sera la base para sync robusta y reintentos |

## Ajuste recomendado para alinear MVP 1 con el producto real

La arquitectura actual ya va en la direccion correcta, pero para que MVP 1 refleje el objetivo real del producto todavia faltan dos piezas de datos explicitas:

- `budget_income_items` para ingresos esperados del mes
- `debts` para obligaciones activas con pago minimo y prioridad

Ademas, `categories` deberian extenderse con metadata presupuestaria como:

- `budget_role`
- `is_essential`
- `default_goal_local_id`
- `default_debt_local_id`

Esto no cambia la arquitectura. Solo completa el dominio de presupuesto dentro del mismo modelo offline-first.

### Entidades ya preparadas para MVP 2 y MVP 3

| Grupo | Tablas | Por que ya existen en schema | Estado actual |
| --- | --- | --- | --- |
| negocio | `businesses`, `customers`, `suppliers`, `products`, `services`, `sales`, `sale_items`, `purchases`, `purchase_items` | evitan redisenar ownership y relaciones cuando llegue el contexto comercial | modeladas, no son foco activo de producto |
| inventario | `inventory_items`, `stock_movements` | permiten separar stock actual de historial de movimientos | modeladas, no son foco activo de producto |

## Metadata de sync y por que existe

La mayoria de las entidades persistentes comparten esta metadata:

| Campo | Para que sirve localmente | Como sirve despues en nube |
| --- | --- | --- |
| `local_id` | identifica la entidad antes de tener servidor | permite crear datos offline y sincronizarlos despues |
| `server_id` | enlaza la fila local con su contraparte cloud | vincula SQLite con MongoDB Atlas |
| `sync_status` | indica si falta sincronizar, si ya sincronizo o si fallo | permite reintentos, auditoria y UX de estado |
| `version` | registra cambios locales | ayuda a resolver conflictos y reconciliacion |
| `created_at` | fecha de creacion | sirve para orden, auditoria y sync incremental |
| `updated_at` | fecha de ultimo cambio | ayuda a detectar cambios y refrescos |
| `deleted_at` | soft delete | evita perder historial y simplifica sync de borrados |

Estados actuales de sync compartidos:

- `pending`
- `synced`
- `failed`

## Modelo de ownership

Muchas entidades usan:

- `owner_type`
- `owner_local_id`

Esto permite:

- reutilizar el mismo modelo para `personal` y `business`
- evitar tablas duplicadas como `personal_transactions` y `business_transactions`
- crecer de MVP 1 a MVP 2 sin romper contratos basicos

## Flujo offline-first esperado

1. El usuario crea o edita un dato.
2. La app valida la accion.
3. La escritura se hace primero en SQLite.
4. La UI lee desde SQLite y refleja el cambio de inmediato.
5. Si la entidad sincroniza a futuro, queda marcada con `sync_status = pending`.
6. La cola local registra la operacion relevante.
7. Cuando haya conectividad, un proceso de sync enviara cambios a la nube.
8. La respuesta cloud actualizara `server_id`, `sync_status`, `version` y otros campos reconciliados.

Aplicado al MVP 1 real:

1. El usuario configura ingresos, gastos esenciales, deudas, metas y preferencias.
2. SQLite guarda el plan y sus entradas asociadas.
3. Un servicio local genera el resumen mensual.
4. Cada transaccion nueva actualiza el seguimiento contra el plan.
5. Las alertas se derivan localmente sin depender de backend.

## Como esta base local prepara MongoDB Atlas

### Regla base

La base local no se diseña como un callejon sin salida. Se diseña para que cada entidad local pueda transformarse en un contrato cloud estable.

### Estrategia de mapeo propuesta

- `users`, `personal_profiles`, `wallets`, `categories`, `transactions`, `budgets`, `goals`, `debts`, `businesses`, `products`, `sales`, `purchases`, `inventory_items` y `stock_movements` pueden mapearse a colecciones o agregados claros en MongoDB Atlas.
- `sale_items`, `purchase_items`, `budget_categories` y `goal_contributions` podran mantenerse como colecciones separadas o pasar a subdocumentos segun necesidades de lectura cloud.
- `budget_income_items` podra mantenerse como coleccion separada o embebida dentro del presupuesto mensual cloud.
- El identificador cloud canonico sera `server_id`.
- `local_id` seguira siendo util para trazabilidad y auditoria del dispositivo.

### Ventajas de esta estrategia

- el dispositivo puede crear datos sin esperar IDs del servidor
- la nube puede consolidar documentos sin perder referencia local
- el modelo soporta sync incremental y conflictos basicos
- se conserva historial suficiente para reportes y futuras reglas de fidelizacion

## Que no debe quedar en SQLite

- secretos o tokens sensibles como regla general
- logica cloud acoplada al detalle de la UI
- datos efimeros puramente visuales que no necesiten persistencia

Cuando aparezcan credenciales o tokens reales, deben evaluarse mecanismos seguros fuera de SQLite.

## Preparacion para MVP 2, MVP 3 y fidelizacion

Esta arquitectura deja preparado:

- cambio de contexto entre `personal` y `business`
- separacion entre transaccion financiera y operacion comercial
- inventario con snapshot e historial
- historial estable para reportes
- eventos comerciales trazables que mas adelante pueden alimentar fidelizacion

La fidelizacion futura va a necesitar, como minimo:

- usuarios y negocios identificables de forma consistente
- ventas sincronizables
- historial confiable
- reglas que no mezclen mal los ownerships

Por eso la base de datos se prepara desde ahora, aunque la funcionalidad quede para una etapa posterior.

## Limites actuales

- La sync cloud todavia no esta implementada.
- MongoDB Atlas es direccion futura, no runtime actual.
- El contrato exacto de la API y de la reconciliacion debera documentarse cuando empiece el trabajo cloud.

## Proximos documentos recomendados

- ADR de estrategia de sync
- diccionario de entidades y campos
- contrato de mapeo SQLite <-> MongoDB Atlas
- mapa de eventos que luego pueda alimentar reportes y fidelizacion
