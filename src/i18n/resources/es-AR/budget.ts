const budget = {
  screen: {
    title: "Plan mensual",
    subtitle:
      "Carga ingresos, gastos esenciales, deudas y metas con lo minimo necesario para generar tu plan.",
    topTabs: {
      plan: "Plan",
      guided: "Guiados",
      manual: "Manual",
    },
    topTabDescriptions: {
      guided:
        "Confirma ingresos y movimientos del plan cuando ya ocurrieron, sin tener que recrearlos a mano.",
      manual:
        "Si el movimiento no sale del plan o necesitas algo puntual, puedes cargarlo manualmente desde aqui.",
    },
    generateAction: "Generar plan mensual",
    updateAction: "Regenerar plan mensual",
    summaryAction: "Ir al resumen",
    manualTitle: "Carga manual",
    manualDescription:
      "Usa esta seccion para movimientos puntuales o fuera del plan. Las categorias se administran aqui mismo, igual que en el flujo rapido anterior.",
    firstPlanTitle: "Primer presupuesto del mes",
    firstPlanDescription:
      "Todavia no hay un plan generado para este mes. Completa las secciones que necesites y luego generalo desde el resumen.",
    partialSaveTitle: "Guardado por seccion",
    partialSaveDescription:
      "Al guardar {{section}} recalculamos el resumen usando lo ultimo confirmado del resto del plan, sin obligarte a recorrer todas las secciones.",
    sectionSavedTitle: "Seccion actualizada",
    sectionSaved: {
      income: "Los ingresos del plan ya quedaron actualizados.",
      essentials: "Los esenciales del plan ya quedaron actualizados.",
      debts: "Las deudas del plan ya quedaron actualizadas.",
      goals: "Las metas del plan ya quedaron actualizadas.",
      preferences: "Las preferencias del plan ya quedaron actualizadas.",
    },
    sectionActions: {
      income: "Actualizar ingresos",
      essentials: "Actualizar esenciales",
      debts: "Actualizar deudas",
      goals: "Actualizar metas",
      preferences: "Actualizar preferencias",
    },
    tabs: {
      income: "Ingresos",
      essentials: "Esenciales",
      debts: "Deudas",
      goals: "Metas",
      preferences: "Preferencias",
      summary: "Resumen",
    },
  },
  loading: "Cargando configuracion financiera...",
  errors: {
    title: "No pudimos preparar el plan",
    saveTitle: "No pudimos generar el plan",
  },
  sections: {
    income: {
      title: "Ingresos del mes",
      description:
        "Empieza por lo que realmente esperas recibir. Con eso calculamos el resto del plan.",
      nameLabel: "Nombre del ingreso",
      amountLabel: "Monto esperado",
      dayLabel: "Dia esperado",
      walletLabel: "Billetera destino",
      walletHelpTitle: "Donde cae este ingreso",
      walletHelpDescription:
        "Sirve para definir en que billetera esperas recibir este ingreso. Mas adelante podremos usarlo para automatizar el registro.",
      dayPlaceholder: "Selecciona un dia",
      clearDayAction: "Quitar dia",
      primaryAction: "Principal",
      addAction: "Agregar ingreso",
      removeAction: "Quitar ingreso",
    },
    essentials: {
      title: "Gastos esenciales",
      description: "Marca solo lo que debe estar cubierto si o si cada mes.",
      amountLabel: "Monto mensual",
      quickMode:
        "Ajusta los montos del mes y usa gestionar si necesitas cambiar la lista.",
      manageMode: "Crea esenciales propios o edita solo los que agregaste tu.",
      openManage: "Gestionar esenciales",
      closeManage: "Volver a montos",
      emptyTitle: "Todavia no hay esenciales",
      emptyDescription:
        "Agrega una categoria esencial para empezar a planificarla dentro del mes.",
      nameLabel: "Nombre del esencial",
      namePlaceholder: "Ej: Alquiler, Internet o Colegio",
      createAction: "Crear esencial",
      renameAction: "Guardar nombre",
      cancelEditAction: "Cancelar",
      validation: {
        nameRequired: "La categoria esencial necesita un nombre.",
        nameDuplicate: "Ya existe un esencial con ese nombre.",
        saveFailed: "No pudimos guardar la categoria esencial.",
      },
    },
    debts: {
      title: "Deudas activas",
      description:
        "Carga solo lo necesario para planificar pagos reales este mes.",
      helpTitle: "Como leer una deuda",
      helpDescription:
        "Saldo actual es lo que todavia debes hoy. Pago minimo es lo minimo para no caer en mora. Pago objetivo es lo que quieres destinar este mes si puedes avanzar mas rapido.",
      addAction: "Agregar deuda",
      removeAction: "Quitar deuda",
      nameLabel: "Nombre",
      balanceLabel: "Saldo actual",
      balanceHelpTitle: "Saldo actual",
      balanceHelpDescription:
        "Carga el saldo restante real de hoy, no el valor original de la deuda.",
      minimumLabel: "Pago minimo",
      targetLabel: "Pago objetivo",
      targetHelpTitle: "Pago objetivo",
      targetHelpDescription:
        "Es el monto que quieres pagar este mes. Si no puedes avanzar mas, deja el mismo valor que el pago minimo.",
      installmentsLabel: "Cuotas totales",
      installmentsHelpTitle: "Plan de cuotas",
      installmentsHelpDescription:
        "Usalo si la deuda tiene un numero claro de cuotas. Asi podemos mostrar cuanto tramo te queda por delante.",
      installmentsPaidLabel: "Cuotas pagadas",
      startDateLabel: "Fecha de inicio",
      startDateHelpTitle: "Cuando arranca esta deuda",
      startDateHelpDescription:
        "Si la deuda empieza mas adelante, cargala igual. Mientras su primera cuota quede fuera de este mes no la sumamos al plan actual.",
      startDatePlaceholder: "Selecciona una fecha",
      clearStartDateAction: "Quitar inicio",
      dueDayLabel: "Dia de vencimiento",
      dueDayPlaceholder: "Selecciona un dia",
      clearDueDayAction: "Quitar vencimiento",
      payoffTargetDateLabel: "Fecha objetivo de cierre",
      payoffTargetDateHelpTitle: "Hasta cuando quieres cancelarla",
      payoffTargetDateHelpDescription:
        "Puedes marcar una fecha objetivo para comparar si tu pago mensual actual alcanza para cerrar la deuda en ese plazo.",
      payoffTargetDatePlaceholder: "Selecciona una fecha",
      clearPayoffTargetDateAction: "Quitar fecha objetivo",
      projectionTitle: "Lectura rapida",
      remainingInstallments:
        "Si mantienes este ritmo, te quedan aprox. {{count}} cuotas por cubrir de un total de {{total}}.",
      targetPaymentSummary:
        "Con el pago mensual elegido estamos proyectando {{amount}} por mes para esta deuda.",
      futureMonthNotice:
        "Esta deuda empieza cerca del {{date}}, asi que no entra en el plan del mes actual.",
      nextInstallmentDate: "La proxima cuota quedaria cerca del {{date}}.",
      scheduledCompletionDate:
        "Segun el cronograma de cuotas, la ultima caeria cerca del {{date}}.",
      payoffDateEstimate:
        "Al ritmo actual terminarias aproximadamente en {{months}} meses, cerca del {{date}}.",
      payoffDateWarning:
        "Con el pago actual llegarias cerca del {{date}}, asi que te conviene subir el pago o mover la fecha objetivo.",
    },
    goals: {
      title: "Metas de ahorro",
      description:
        "Define lo que quieres reservar este mes sin mezclarlo con gasto cotidiano.",
      helpTitle: "Como leer una meta",
      helpDescription:
        "Monto objetivo es el total final que quieres juntar. Aporte mensual es solo lo que planeas separar este mes para acercarte a esa meta.",
      addAction: "Agregar meta",
      removeAction: "Quitar meta",
      nameLabel: "Nombre",
      descriptionLabel: "Descripcion (opcional)",
      descriptionHelpTitle: "Para que sirve esta meta",
      descriptionHelpDescription:
        "Puedes dejar una nota corta para recordar el destino de este ahorro o la prioridad que tiene.",
      targetLabel: "Monto objetivo",
      targetHelpTitle: "Monto objetivo",
      targetHelpDescription:
        "Es el total final que quieres alcanzar con esta meta, no solo lo de este mes.",
      monthlyContributionLabel: "Aporte mensual",
      monthlyContributionHelpTitle: "Aporte mensual",
      monthlyContributionHelpDescription:
        "Es lo que quieres reservar durante este mes para avanzar la meta.",
      savingsTypeLabel: "Tipo de ahorro",
      savingsTypeHelpTitle: "Donde planeas guardar esta meta",
      savingsTypeHelpDescription:
        "El tipo de ahorro nos ayuda a interpretar mejor si la meta solo guarda dinero, si genera rendimiento o si asume un perfil mas de inversion.",
      savingsType: {
        cash: "Sin rendimiento",
        yieldAccount: "Cuenta remunerada",
        investment: "Inversion",
      },
      annualYieldRateLabel: "Rendimiento anual esperado",
      annualYieldRateHelpTitle: "Tasa estimada",
      annualYieldRateHelpDescription:
        "Si este dinero genera rendimiento, carga una tasa anual estimada para proyectar mejor cuanto tendrias con el paso de los meses.",
      annualYieldRateHint:
        "Si no aplica rendimiento, puedes dejarlo vacio o en 0.",
      annualYieldRateInvestmentHint:
        "Carga una tasa esperada solo si quieres proyectar la meta con un escenario orientativo de inversion.",
      cashModeHint:
        "Como esta meta no genera rendimiento, la proyeccion usa solo lo que ya tienes mas el aporte mensual.",
      targetDateLabel: "Fecha objetivo",
      targetDatePlaceholder: "Selecciona una fecha",
      clearTargetDateAction: "Quitar fecha",
      capacityOkTitle: "Tus metas entran en el presupuesto",
      capacityOkDescription:
        "Estas proponiendo ahorrar {{desired}} por mes y hoy el plan deja un margen aproximado de {{available}} para metas.",
      capacityWarningTitle: "El ahorro propuesto aprieta tu presupuesto",
      capacityWarningDescription:
        "Estas proponiendo ahorrar {{desired}} por mes pero el plan hoy deja un margen aproximado de {{available}}. Tomalo como una sugerencia para ajustar el aporte.",
      projectionTitle: "Proyeccion orientativa",
      currentAmountSummary: "Ya tienes acumulado {{amount}} en esta meta.",
      monthlyContributionSummary:
        "Con el aporte mensual elegido esta meta sumaria {{amount}} por mes.",
      projectionModeCash:
        "Modo actual: sin rendimiento. Cambia el tipo de ahorro si quieres proyectar intereses o inversion.",
      projectionModeRate:
        "Modo actual: {{type}} con una tasa anual orientativa de {{rate}}%.",
      twelveMonthProjection:
        "Si mantienes este ritmo, en 12 meses tendrias aprox. {{amount}}.",
      targetDateWarning:
        "Con el ritmo actual llegarias despues de la fecha objetivo, cerca del {{date}}.",
      targetDateOk:
        "Con el ritmo actual alcanzarias la meta antes o cerca del {{date}}.",
      completionEstimate:
        "Sin fecha objetivo marcada, la proyeccion da un cierre aproximado en {{months}} meses, cerca del {{date}}.",
    },
    preferences: {
      title: "Preferencias del plan",
      description:
        "Define como quieres repartir el dinero cuando no alcanza para cubrir todo el mes.",
      strategyLabel: "Estrategia",
      strategyHelpTitle: "Como usamos la estrategia",
      strategyHelpDescription:
        "Prioridades cubre primero lo indispensable. Base cero reparte todo el ingreso en un destino concreto. Ingreso primero ordena el plan segun cuando entra el dinero.",
      bufferModeLabel: "Tipo de colchon",
      bufferModeHelpTitle: "Que es el colchon",
      bufferModeHelpDescription:
        "Es una reserva de seguridad para no dejar el mes sin margen. Puedes definirla como porcentaje del ingreso esperado o como un monto fijo.",
      bufferValueLabel: "Valor del colchon",
      bufferValueHelpTitle: "Como definir el valor",
      bufferValueHelpDescriptionPercentage:
        "Se calcula sobre el ingreso esperado del mes. Por ejemplo, 10 significa guardar el 10% como reserva.",
      bufferValueHelpDescriptionFixedAmount:
        "Se guarda como una reserva fija en dinero. Por ejemplo, 50000 significa separar ese monto antes de repartir el resto.",
      bufferValueModeDescriptionPercentage:
        "Se aplicara como porcentaje sobre el ingreso esperado del mes.",
      bufferValueModeDescriptionFixedAmount:
        "Se aplicara como un monto fijo reservado para imprevistos.",
      allowFlexibleLabel: "Permitir gasto flexible",
      prioritizeDebtLabel: "Priorizar deudas sobre metas",
      prioritizeDebtHelpTitle: "Que pasa si no alcanza",
      prioritizeDebtHelpDescription:
        "Si activas esta opcion, el plan intenta cubrir pagos de deuda antes de separar dinero para metas de ahorro.",
      strategy: {
        priorityBased: "Prioridades",
        zeroBased: "Base cero",
        incomeFirst: "Ingreso primero",
      },
      bufferMode: {
        percentage: "Porcentaje",
        fixedAmount: "Monto fijo",
      },
      yes: "Si",
      no: "No",
    },
  },
  summary: {
    title: "Resumen final",
    description:
      "Aqui ves lo esencial del plan sin revisar cada bloque por separado.",
    incomeLabel: "Ingreso previsto",
    incomeHelper: "Ya contempla esenciales por {{essentials}}.",
    debtLabel: "Deudas del mes",
    debtHelper:
      "Activas este mes: {{count}}. Programadas para mas adelante: {{deferred}}.",
    goalCapacityLabel: "Margen para metas",
    goalCapacityHelper:
      "Es el espacio estimado que queda para ahorrar despues de lo fijo.",
    bufferLabel: "Colchon",
    bufferHelper: "Reserva separada para no dejar el mes sin margen.",
    projectionTitle: "Proyeccion orientativa",
    projectedDebtFreeDate:
      "Si mantienes los datos actuales, terminarias las deudas proyectables cerca del {{date}}. Hoy estamos siguiendo {{count}} proyecciones.",
    projectedDebtFreeDateMissing:
      "Todavia faltan datos para estimar cuando quedarias libre de deudas. La mejor combinacion es fecha de inicio, cuotas y/o pago objetivo.",
    projectedGoalValue:
      "Manteniendo este ritmo, tus metas podrian acumular aprox. {{amount}} en los proximos 12 meses.",
    projectedGoalValueMissing:
      "Todavia no hay suficientes metas cargadas como para proyectar ahorro a 12 meses.",
    upcomingGoalCompletionDate:
      "La meta mas cercana podria completarse alrededor del {{date}}.",
    savingsOpportunityTitle: "Todavia puedes ahorrar un poco mas",
    savingsOpportunityDescription:
      "Con el presupuesto actual aun tendrias un margen de {{amount}} por mes para reforzar metas o colchon.",
    savingsBalancedTitle: "El plan ya viene bastante equilibrado",
    savingsBalancedDescription:
      "Por ahora no sobra margen claro ni hace falta recortar. Si quieres ahorrar mas, tendrias que mover gastos o subir ingresos.",
    savingsTightTitle: "Tus metas hoy piden mas de lo que deja el plan",
    savingsTightDescription:
      "Para sostener el aporte deseado tendrias que liberar alrededor de {{amount}} por mes.",
  },
} as const;

export default budget;
