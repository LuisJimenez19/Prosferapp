---
title: UX UI MVP 1 Finanzas personales
status: active
owner: product-engineering
last_updated: 2026-04-09
tags: [ux, ui, mvp-1, figma, personal-finance]
summary: Documenta la direccion visual y las reglas UX del MVP 1 tomando como referencia el archivo de Figma y priorizando un plan mensual simple de entender y rapido de seguir.
---

# UX UI MVP 1 Finanzas personales

## Objetivo

Definir como debe verse y comportarse la experiencia principal del MVP 1 para que la app sea:

- simple de entender
- rapida de usar
- consistente con la paleta y la jerarquia visual del Figma
- preparada para crecer sin perder claridad

## Referencia visual

Fuente base de diseno:

- Figma: `https://www.figma.com/design/fK07e2qSV9ckNJxwKZKtfX/Sin-t%C3%ADtulo?t=3h4TueyLY7jNPAke-0`

Pantallas tomadas como referencia principal:

- `Wallets`
- `Add Transaction`

## Principio rector de UX

La app no debe pedirle al usuario que reconstruya su economia mentalmente todos los dias.

En ProsferApp, la persona necesita primero entender su plan del mes y despues registrar rapido lo que realmente va pasando.

Por eso el flujo debe minimizar:

- pasos
- decisiones innecesarias
- cambios de contexto
- acciones administrativas mezcladas con la carga diaria

## Reglas de experiencia

- Primero entender el plan mensual, despues registrar ejecucion.
- La home debe responder antes que nada si el usuario va segun plan o se esta desviando.
- Primero monto, despues categoria, despues confirmar.
- La billetera predeterminada debe quedar seleccionada por defecto.
- La fecha de hoy debe venir cargada por defecto.
- La nota es opcional y no debe estorbar el flujo principal.
- Gestionar categorias es una accion secundaria, no parte del camino principal de carga.
- La interfaz debe explicar el estado del dinero con jerarquia visual, no con mucho texto.

## Paleta visual

La direccion visual toma la paleta del Figma:

- fondo principal muy claro: `#f7fafc`
- superficies suaves: `#f1f4f6`
- texto principal oscuro: `#181c1e`
- texto secundario: `#414752`
- texto tenue: `#717784`
- azul principal: `#005cab`
- azul de accion: `#0d75d4`
- azul de apoyo: `#00658f`
- verde de resultado positivo: `#006945`

## Reglas visuales

- Usar tarjetas con jerarquia clara y bordes suaves.
- Reservar el azul fuerte para acciones primarias y tarjetas destacadas.
- Usar fondos neutros para informacion secundaria.
- Evitar pantallas sobrecargadas de botones equivalentes.
- El estado seleccionado debe entenderse por color, borde y contraste.

## Guardrails de implementacion

- En codigo no se usan hex directos dentro de pantallas; se consumen tokens semanticos.
- La paleta base vive en tema compartido y los acentos del dominio financiero viven en tokens propios del feature.
- El redondeo no se define por pixeles sueltos; se hereda desde `--radius` y las variantes compartidas tipo shadcn.
- Tabs, modales y shells de navegacion deben contemplar safe area inferior para no quedar debajo de la navegacion del telefono.

## Pantalla de inicio

La pantalla inicial debe cumplir cuatro objetivos en este orden:

1. mostrar el estado del plan mensual
2. explicar desviaciones o alertas de forma simple
3. ofrecer una accion primaria visible para registrar un movimiento
4. dejar acceso claro a wallets y movimientos recientes sin robar protagonismo al plan

Decisiones aplicadas:

- tarjeta principal de resumen mensual arriba
- indicadores cortos de plan vs real debajo
- alertas locales visibles si hay desvio importante
- wallets y movimientos como contexto operativo secundario

## Pantalla de billeteras

La pantalla de billeteras no es el centro del uso diario. Debe funcionar como un espacio de administracion liviano.

Decisiones aplicadas:

- resumen total arriba
- acciones claras para crear billetera o registrar movimiento
- cards simples con icono, saldo, moneda y acciones
- edicion y eliminacion visibles, pero sin competir con la lectura del saldo

## Pantalla de transaccion

Es una pantalla critica, pero ya no es el centro conceptual del MVP 1.

Su rol correcto es alimentar rapido el seguimiento del plan mensual.

### Flujo principal

1. elegir tipo de movimiento
2. escribir monto
3. elegir categoria
4. confirmar

### Flujo secundario

- cambiar billetera
- cambiar fecha
- agregar nota
- gestionar categorias

### Reglas aplicadas

- el monto ocupa el mayor peso visual
- la categoria se elige en una grilla rapida
- la gestion de categorias vive en un modo separado
- si la categoria impacta deuda o meta, la UI debe sugerirlo sin agregar friccion
- existen dos cierres utiles: `Guardar y seguir` y `Guardar transaccion`

La opcion `Guardar y seguir` es importante porque el usuario puede venir de registrar varios movimientos reales de una sola vez.

## Criterios para futuras pantallas

- Si una pantalla es de uso frecuente, debe optimizar tiempo de carga mental.
- Si una pantalla es administrativa, puede mostrar mas detalle pero menos protagonismo visual.
- No mezclar configuracion avanzada con accion diaria.
- Reutilizar colores, espaciados y jerarquia de esta base antes de inventar nuevas variantes.

## Impacto en documentacion y RAG

Este documento existe para que la direccion UX no quede solo implicita en el codigo o en Figma.

Deberia poder responder preguntas como:

- por que la home prioriza el plan mensual
- por que la transaccion prioriza monto y categoria
- por que la gestion de categorias es secundaria
- cual es la paleta canonica del MVP 1
- como debe verse una pantalla frecuente frente a una administrativa

## Proximos documentos recomendados

- mapa de navegacion del MVP 1
- reglas de copy para errores, confirmaciones y estados vacios
- documentacion de accesibilidad base
- especificacion UI de billetera modal y settings
