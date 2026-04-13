const wallets = {
  screen: {
    title: "Tus billeteras",
    subtitle:
      "Mantiene visibles tus saldos y deja lista la billetera correcta para registrar mas rapido.",
  },
  overview: {
    balanceLabel: "Balance total",
    description:
      "Cada billetera refleja su saldo actual y sigue disponible aun sin conexion.",
  },
  info: {
    eyebrow: "Persistencia local",
    title: "Las billeteras se guardan directo en SQLite y siguen disponibles sin conexion.",
    description:
      "Los cambios de saldo despues de crear una billetera deben venir de transacciones, no de ediciones manuales.",
  },
  loading: {
    wallets: "Cargando billeteras...",
  },
  errors: {
    invalidDetails: "Revisa los datos de la billetera",
    loadFailed: "No se pudieron cargar las billeteras.",
    saveFailed: "No se pudo guardar la billetera localmente.",
    saveFailedTitle: "No se pudo guardar la billetera",
    deleteFailed: "No se pudo eliminar la billetera.",
    deleteFailedTitle: "No se pudo eliminar la billetera",
    missingContext: "El contexto personal no esta disponible.",
    walletNotFound: "La billetera que intentas editar ya no existe.",
    deleteSummaryMissing: "No se encontro la billetera que intentas eliminar.",
  },
  actions: {
    createWallet: "Crear billetera",
    manageWallets: "Administrar billeteras",
  },
  form: {
    createTitle: "Crear billetera",
    editTitle: "Editar billetera",
    createDescription:
      "Agrega una billetera para efectivo, banco, tarjeta o ahorros.",
    editDescription:
      "Actualiza la identidad y el estado predeterminado. El historial de transacciones sigue controlando el saldo actual.",
    fields: {
      name: "Nombre",
      walletType: "Tipo de billetera",
      currencyCode: "Codigo de moneda",
      openingBalance: "Saldo inicial",
      defaultWallet: "Billetera predeterminada",
      currentBalance: "Saldo actual",
    },
    placeholders: {
      name: "Nombre de la billetera",
      currencyCode: "ARS",
      openingBalance: "0,00",
    },
    submitCreate: "Crear billetera",
    submitEdit: "Guardar cambios",
    createNew: "Nueva billetera",
  },
  list: {
    title: "Billeteras guardadas",
    total: "{{count}} total",
    emptyTitle: "Todavia no hay billeteras",
    emptyDescription:
      "Crea la primera billetera para empezar a registrar movimientos sin perder contexto.",
    emptyAction: "Crear primera billetera",
    card: {
      defaultLabel: "predeterminada",
      currency: "Moneda",
      openingBalance: "Saldo inicial",
      edit: "Editar billetera",
      delete: "Eliminar billetera",
    },
  },
  delete: {
    title: "Eliminar billetera",
    descriptionBase:
      'La billetera "{{name}}" dejara de estar disponible para nuevas transacciones.',
    descriptionBalance:
      "Su saldo actual de {{amount}} dejara de sumar en el total visible.",
    descriptionTransactions:
      "{{count}} transacciones historicas seguiran existiendo y mantendran su referencia actual.",
    descriptionDefault:
      "Si era la billetera predeterminada, otra billetera activa pasara a ocupar ese lugar.",
  },
  types: {
    cash: "efectivo",
    bank: "banco",
    card: "tarjeta",
    savings: "ahorros",
    digital: "digital",
    other: "otra",
  },
  validation: {
    nameRequired: "El nombre de la billetera es obligatorio.",
    currencyInvalid:
      "El codigo de moneda debe tener 3 letras, por ejemplo ARS.",
    amountRequired: "El monto es obligatorio.",
    amountInvalid: "Ingresa un monto valido con hasta 2 decimales.",
    amountPositive: "El monto debe ser mayor a cero.",
  },
} as const;

export default wallets;
