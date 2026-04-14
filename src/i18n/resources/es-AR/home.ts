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
      "El resumen se recalcula localmente con cada movimiento para mostrarte rapido si te estas desviando y en que parte del plan pasa.",
    setupAction: "Configurar plan",
    editAction: "Ajustar plan",
    dashboardAction: "Abrir dashboard",
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
    highlights: {
      actualIncome: "Ingreso real",
      flexibleRemaining: "Flexible disponible",
      buffer: "Colchon",
    },
    comparisons: {
      title: "Plan vs realidad",
      subtitle:
        "Compara rapidamente cada bloque del presupuesto para detectar si vas dentro del plan o si ya te falta ajustar algo.",
      plannedLabel: "Plan {{amount}}",
      items: {
        income: "Ingresos",
        essentials: "Esenciales",
        debts: "Deudas",
        goals: "Metas",
        flexible: "Flexible",
      },
      status: {
        cap: {
          above: "Fuera",
          aligned: "Al limite",
          below: "Dentro",
        },
        target: {
          above: "Cubierto",
          aligned: "Al dia",
          below: "Pendiente",
        },
      },
      delta: {
        cap: {
          above: "{{amount}} por encima",
          aligned: "En tu limite",
          below: "{{amount}} libres",
        },
        target: {
          above: "{{amount}} por encima",
          aligned: "Objetivo cumplido",
          below: "{{amount}} pendientes",
        },
      },
    },
    essentials: {
      title: "En que esencial te desvias",
      subtitle:
        "Aqui ves categoria por categoria lo que planificaste para esenciales y lo que realmente terminaste registrando.",
      emptyTitle: "Todavia no hay esenciales activos",
      emptyDescription:
        "Cuando el plan tenga esenciales con monto o empieces a registrar gastos, aqui veras el detalle.",
      plannedVsActual: "Real {{actual}} | Plan {{planned}}",
      planLabel: "Plan {{amount}}",
      status: {
        above: "Te pasaste",
        aligned: "Exacto",
        below: "Dentro",
      },
      delta: {
        above: "{{amount}} arriba",
        aligned: "Sin desvio",
        below: "{{amount}} disponibles",
      },
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
        "Cada movimiento alimenta el seguimiento del mes en el mismo momento en que lo registras. Desde aqui puedes saltar al historial completo.",
      action: "Cargar otro",
      viewAll: "Ver historial completo",
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
