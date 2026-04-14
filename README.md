# ProsferApp

ProsferApp es una app mobile offline-first para presupuesto personal, seguimiento del plan mensual y registro guiado de movimientos.

## Stack principal

- Expo 54
- React Native 0.81
- Expo Router
- NativeWind
- SQLite local
- i18next
- Victory Native para visualizaciones del dashboard

## Scripts utiles

```bash
npm install
npm run start
npm run start:clear
npm run android
npm run android:clear
npm run ios
npm run ios:clear
npm run lint
npx tsc --noEmit
```

## Estructura

- `app/`: rutas con Expo Router
- `src/features/personal-finance/`: dominio principal del MVP 1
- `src/components/ui/`: catalogo de componentes reutilizables
- `src/database/`: schema, migraciones y acceso local
- `docs/`: documentacion viva del producto, arquitectura y UX

## Documentacion recomendada

- [Mapa de documentacion](./docs/README.md)
- [Modelo de dominio MVP 1 presupuesto personal](./docs/mvp1-budget-domain.md)
- [MVP 1 captura de actividad y seguimiento del plan](./docs/mvp1-activity-capture-plan-tracking.md)
- [Backend readiness para finanzas personales](./docs/backend-readiness-personal-finance.md)
- [UI financiera MVP 1](./docs/ux/mvp1-finance-ui.md)
- [Dashboard y monitoreo del plan mensual](./docs/ux/mvp1-budget-monitoring-dashboard.md)

## Nota operativa

Si agregas o cambias dependencias de bundling, charts o librerias nativas, usa `npm run start:clear` o `npm run android:clear` para limpiar la cache de Metro antes de diagnosticar errores de resolucion.
