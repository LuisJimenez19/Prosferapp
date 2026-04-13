const transactions = {
  common: {
    title: "Transacciones",
    create: "Registrar movimiento",
    income: "Ingreso",
    expense: "Gasto",
  },
  createScreen: {
    title: "Registrar movimiento",
    subtitle:
      "Carga primero el monto y la categoria. La billetera y la fecha ya vienen resueltas para que uses menos pasos.",
    quickEntry: {
      eyebrow: "Carga rapida",
      adds: "Suma {{amount}}",
      subtracts: "Resta {{amount}}",
      empty:
        "Escribe un monto y elige una categoria para ver el impacto antes de guardar.",
      walletLabel: "Billetera: {{name}}",
    },
    loading: "Cargando formulario...",
    errors: {
      invalidForm: "Revisa el formulario",
      loadFailed: "No se pudieron cargar los datos de la transaccion.",
      missingContext: "El contexto personal no esta disponible.",
      incompleteSelection: "Completa la seleccion de billetera y categoria.",
      saveFailed: "No se pudo guardar la transaccion localmente.",
      saveFailedTitle: "No se pudo guardar la transaccion",
      noWalletsTitle: "No hay billeteras disponibles",
      noWalletsDescription:
        "Crea una billetera antes de guardar tu primera transaccion.",
      noCategoriesTitle: "No hay categorias compatibles",
      noCategoriesDescription:
        "Crea una categoria de tipo {{type}} antes de guardar esta transaccion.",
    },
    sections: {
      transactionType: {
        title: "Tipo de transaccion",
        description:
          "Elige si este movimiento aumenta o reduce tu saldo.",
      },
      amountHero: {
        expenseEyebrow: "Monto a restar",
        incomeEyebrow: "Monto a sumar",
      },
      wallet: {
        title: "Billetera",
        helper: "La billetera predeterminada queda lista para guardar mas rapido.",
      },
      category: {
        title: "Categoria",
        description:
          "Elige una categoria visual. Si necesitas administrar la lista, hazlo en un paso aparte.",
        quickMode: "Carga rapida",
        manageMode: "Gestionar categorias",
        toggleManage: "Editar lista",
        closeManage: "Volver a cargar rapido",
        searchLabel: "Nombre de la categoria",
        searchPlaceholder: "Escribe para buscar o crear",
        create: 'Crear categoria "{{name}}"',
        update: "Guardar cambios en categoria",
        cancelEdit: "Cancelar edicion",
        emptySearch: "No hay categorias que coincidan con la busqueda.",
        select: "Seleccionar",
        edit: "Editar",
        delete: "Eliminar",
        deleteTitle: "Eliminar categoria",
        deleteDescriptionNoUsage:
          'La categoria "{{name}}" dejara de estar disponible para nuevas transacciones.',
        deleteDescriptionWithUsage:
          'La categoria "{{name}}" dejara de estar disponible para nuevas transacciones. {{count}} transacciones historicas seguiran mostrando su referencia actual.',
      },
      amount: {
        title: "Monto",
      },
      details: {
        title: "Detalles opcionales",
      },
      description: {
        title: "Descripcion",
        description:
          "Nota opcional para reconocer este movimiento mas adelante.",
        placeholder: "Agregar nota",
      },
      date: {
        title: "Fecha",
        description: "Usa la fecha local esperada por la app.",
        placeholder: "AAAA-MM-DD",
      },
      submit: {
        title: "Listo para guardar",
        description:
          "Valida localmente, guarda en SQLite y vuelve a la pantalla principal.",
        action: "Guardar transaccion",
        actionAndContinue: "Guardar y seguir",
      },
    },
    categoryKinds: {
      income: "ingreso",
      expense: "gasto",
    },
    validation: {
      walletRequired: "Selecciona una billetera.",
      categoryRequired: "Selecciona una categoria.",
      amountRequired: "El monto es obligatorio.",
      amountInvalid: "Ingresa un monto valido con hasta 2 decimales.",
      amountPositive: "El monto debe ser mayor a cero.",
      dateInvalid: "La fecha debe usar el formato AAAA-MM-DD.",
      categoryNameRequired: "El nombre de la categoria es obligatorio.",
      categoryDuplicate:
        "Ya existe una categoria con ese nombre para este tipo de transaccion.",
      categorySaveFailed: "No se pudo guardar la categoria.",
      categoryDeleteFailed: "No se pudo eliminar la categoria.",
    },
  },
} as const;

export default transactions;
