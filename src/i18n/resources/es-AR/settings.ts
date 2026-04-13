const settings = {
  screen: {
    title: "Configuracion",
    subtitle: "Administra opciones locales y acciones importantes de tu cuenta.",
    budgetCardTitle: "Plan mensual",
    budgetCardDescription:
      "Configura ingresos, gastos esenciales, deudas y metas para generar tu presupuesto local.",
    budgetCardAction: "Ir al plan mensual",
    resetCardTitle: "Restablecer datos",
    resetCardDescription:
      "Vuelve a dejar la cuenta como la primera vez, recreando los datos iniciales locales.",
    resetAction: "Ir a restablecer datos",
  },
  reset: {
    title: "Restablecer datos de la cuenta",
    subtitle:
      "Esta accion borra la base local actual y vuelve a crear el estado inicial de la app.",
    warningTitle: "Antes de continuar",
    warningDescription:
      "Se eliminaran billeteras, categorias, transacciones y configuraciones locales actuales. Luego se recreara el estado inicial.",
    confirmTitle: "Confirmar restablecimiento",
    confirmDescription:
      "Esta accion es critica. Se perderan los datos locales actuales y la app volvera a empezar con la informacion inicial.",
    submit: "Restablecer datos ahora",
    successTitle: "Datos restablecidos",
    successDescription:
      "La cuenta local se restablecio y la app fue preparada otra vez con los datos iniciales.",
    errorTitle: "No se pudo restablecer",
    errorDescription:
      "Ocurrio un problema al restablecer la base local. Intentalo nuevamente.",
  },
} as const;

export default settings;
