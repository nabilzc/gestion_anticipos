
// data.js - Datos Estructurados del Manual de Políticas y Procedimientos Financieros FUNDAEC

const MANUAL_DATA = {
    limits: {
        presupuestado: [
            { max: 25000000, roles: ["Auxiliar Contable", "Analista Financiero"], level: 1 },
            { max: 50000000, roles: ["Cualquiera de los anteriores", "Director Financiero"], level: 2 },
            { max: 100000000, roles: ["Cualquiera de los anteriores", "Director Ejecutivo (o suplente)"], level: 3 },
            { max: Infinity, roles: ["Junta Directiva"], level: 4 }
        ],
        noPresupuestado: [
            { max: 10000000, roles: ["Analista Financiero", "Director Financiero"], level: 1 },
            { max: 25000000, roles: ["Cualquiera de los anteriores", "Director Ejecutivo (o suplente)"], level: 2 },
            { max: Infinity, roles: ["Junta Directiva"], level: 3 }
        ],
        prestamos: [
            { max: 250000000, roles: ["Analista Financiero", "Director Financiero", "Comité de Crédito"], level: 1 },
            { max: Infinity, roles: ["Junta Directiva"], level: 2 }
        ]
    },
    procedures: {
        pago: [
            "1. Solicitud de pago: Diligenciar formato interno con soportes.",
            "2. Revisión presupuestal y contable: Revisar disponibilidad y clasificación.",
            "3. Aprobación: Obtener firmas según tabla de límites (Sección 11.3).",
            "4. Registro contable: Registrar obligación en contabilidad.",
            "5. Ejecución del pago: Realizar transferencia o cheque.",
            "6. Archivo: Guardar comprobante físico o digital."
        ]
    },
    sections: {
        "11.3": "Límites de Aprobación para Egresos",
        "15": "Procedimiento para Pagos",
        "16": "Control de Cambios"
    }
};
