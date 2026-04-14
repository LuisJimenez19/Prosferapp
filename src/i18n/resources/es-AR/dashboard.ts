const dashboard = {
  screen: {
    eyebrow: "Dashboard",
    title: "Tu lectura del mes",
    subtitle:
      "Aqui ves con mas detalle como se reparte el plan, en que esenciales te estas desviando y que bloques del mes necesitan atencion.",
    cta: "Ir al plan mensual",
    emptyTitle: "Todavia no hay un plan para analizar",
    emptyDescription:
      "Genera primero tu plan mensual para abrir el dashboard con estadisticas utiles.",
  },
  charts: {
    essentials: {
      title: "Distribucion de esenciales",
      subtitle:
        "El grafico muestra como se reparte hoy cada esencial. Si todavia no registraste movimientos, usa el plan cargado como referencia.",
      actualMode: "Basado en tu ejecucion real",
      plannedMode: "Todavia sin movimientos: usando el plan",
      centerLabel_one: "{{count}} esencial activo",
      centerLabel_other: "{{count}} esenciales activos",
      emptyTitle: "Todavia no hay esenciales para graficar",
      emptyDescription:
        "Cuando el plan tenga esenciales con monto o empieces a registrar gastos, apareceran aqui.",
    },
    areas: {
      title: "Como se esta usando el mes",
      subtitle:
        "Reparte el mes entre esenciales, deudas, metas y flexible para que entiendas rapido hacia donde se esta yendo el dinero.",
      actualMode: "Distribucion real del mes",
      plannedMode: "Distribucion planificada",
      centerLabel_one: "{{count}} bloque activo",
      centerLabel_other: "{{count}} bloques activos",
      emptyTitle: "Todavia no hay bloques para graficar",
      emptyDescription:
        "Cuando el plan tenga montos asignados o empieces a registrar movimientos, aqui veras la distribucion general del mes.",
    },
  },
  comparisons: {
    title: "Comparativa por bloque",
    subtitle:
      "Compara cada bloque del plan contra lo que ya paso para decidir si debes ajustar antes de salirte del mes.",
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
    title: "Detalle por esencial",
    subtitle:
      "Debajo del grafico ves categoria por categoria el plan contra la realidad para encontrar exactamente donde se genero el desvio.",
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
  insights: {
    title: "Lectura rapida",
    badges: {
      on_track: "En linea",
      warning: "Con desvio",
      off_track: "Fuera de plan",
    },
    debts: "{{count}} deudas activas siguen afectando el mes.",
    goals: "{{count}} metas activas siguen pidiendo aporte.",
    flexibleRemaining:
      "Te quedan {{amount}} de margen flexible dentro del bloque libre del mes.",
    flexibleExceeded:
      "Ya gastaste {{amount}} por encima de tu margen flexible. Conviene frenar el gasto libre o recalcular el plan.",
    essentialsExceeded:
      "Ya te saliste del plan en esenciales por {{amount}}. Revisa {{count}} categoria afectada.",
    essentialsExceeded_other:
      "Ya te saliste del plan en esenciales por {{amount}}. Revisa {{count}} categorias afectadas.",
    debtsPending:
      "Todavia faltan {{amount}} para cubrir las deudas previstas de este mes.",
    goalsPending:
      "Todavia faltan {{amount}} para alcanzar el aporte planificado a tus metas.",
    debtsAndGoalsPending:
      "Todavia faltan {{debts}} en deudas y {{goals}} en metas para quedar al dia con el plan.",
    offTrackFallback:
      "El mes ya se desvio del plan. Revisa el detalle por bloque para entender donde se produjo la diferencia.",
  },
  legend: {
    actual: "Real",
    planned: "Plan",
  },
  errors: {
    title: "No pudimos cargar el dashboard",
  },
  loading: "Preparando el dashboard...",
} as const;

export default dashboard;
