const home = {
  screen: {
    eyebrow: "Plan mensual",
    title: "Tu presupuesto personal",
    subtitle:
      "Entiende si vas segun plan y registra solo lo que realmente ocurre durante el mes.",
  },
  plan: {
    title: "Resumen del plan",
    monthLabel: "Mes activo {{month}}",
    incomeLabel: "Ingreso previsto",
    description:
      "El resumen se recalcula localmente con cada movimiento para mostrarte rapido si te estas desviando.",
    setupAction: "Configurar plan",
    editAction: "Ajustar plan",
    addTransactionAction: "Registrar movimiento",
    emptyTitle: "Todavia no hay plan mensual",
    emptyDescription:
      "Configura ingresos, esenciales, deudas y metas para empezar a medir el mes con claridad.",
    status: {
      on_track: "En plan",
      warning: "Con desvio",
      off_track: "Fuera de plan",
    },
    metrics: {
      essentials: "Esenciales",
      debts: "Deudas",
      goals: "Metas",
      flexible: "Flexible",
      flexibleRemaining: "Restante",
    },
    counters: {
      debtsLabel: "Deudas activas",
      debtsHelper: "{{count}} consideradas en el plan",
      debtsTooltipTitle: "Deudas activas",
      debtsTooltipDescription:
        "Cuenta las deudas que siguen activas y que el plan mensual esta considerando para asignar pagos.",
      goalsLabel: "Metas activas",
      goalsHelper: "{{count}} con seguimiento mensual",
      goalsTooltipTitle: "Metas activas",
      goalsTooltipDescription:
        "Cuenta las metas con aporte mensual configurado. El objetivo total vive en la configuracion del plan, no en este contador.",
    },
    alerts: {
      title: "Alertas del plan",
      calmTitle: "Sin alertas importantes",
      calmDescription:
        "Por ahora tus movimientos no muestran desajustes relevantes frente al plan.",
    },
  },
  sections: {
    wallets: {
      title: "Billeteras",
      subtitle: "Cuentas operativas para registrar lo que realmente paso.",
      viewAll: "Ver todas",
      emptyTitle: "Todavia no hay billeteras",
      emptyDescription:
        "Crea una billetera para empezar a registrar ejecucion real del plan.",
    },
    transactions: {
      title: "Movimientos recientes",
      subtitle:
        "Cada movimiento alimenta el seguimiento del mes en el mismo momento en que lo registras.",
      action: "Cargar otro",
      emptyTitle: "Todavia no hay movimientos",
      emptyDescription:
        "Tu primer movimiento deberia tomar solo unos segundos.",
    },
  },
  loading: "Cargando tu resumen mensual...",
  errors: {
    title: "No pudimos cargar tu resumen",
  },
  wallet: {
    defaultBadge: "Principal",
    openingLabel: "Saldo inicial",
    availableLabel: "Disponible",
  },
} as const;

export default home;
