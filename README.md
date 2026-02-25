# FUNDAEC – Sistema de Gestión de Anticipos

Este es un sistema ERP ligero diseñado para FUNDAEC, enfocado en la gestión, aprobación y cierre de anticipos financieros. La aplicación está construida íntegramente con tecnologías web estándar para garantizar velocidad, portabilidad y facilidad de mantenimiento.



## 🛠️ Funcionalidades Principales

### 1. Sistema de Autenticación
- Control de acceso basado en roles (**Empleado, Aprobador, Finanzas, Admin**).
- Simulación de sesión persistente.
- Perfiles con permisos granulares (quién puede aprobar, quién puede desembolsar, etc.).

### 2. Dashboard de Control
- Resumen visual mediante **KPIs** (Total de anticipos, abiertos, vencidos y monto total en circulación).
- Listado de actividad reciente para un seguimiento rápido.
- Acceso directo a las acciones principales según el rol.

### 3. Formulario de Solicitud Multi-sección
- **Datos del Solicitante**: Autocompletado basado en la sesión.
- **Desglose de Gastos**: Tabla dinámica para agregar múltiples ítems con cálculo automático de totales.
- **Conversión de Montos**: Transformación automática de números a letras (formato legal).
- **Información Bancaria**: Registro de cuentas para desembolso.
- **Firma Digital Dual**:
    - Posibilidad de **subir una imagen** de la firma.
    - Panel de **dibujo táctil/mouse** para firmar directamente en pantalla.

### 4. Flujo de Trabajo (Workflow)
- **Borradores**: Guardado parcial de solicitudes para envío posterior.
- **Estados del Ciclo de Vida**: Seguimiento detallado desde "Enviado" hasta "Cerrado".
- **Historial de Operaciones**: Registro de auditoría que guarda cada cambio de estado, usuario y fecha.
- **Sistema de Alertas**: Indicadores visuales para anticipos próximos a vencer o vencidos.

### 5. Módulo de Aprobaciones
- Interfaz dedicada para aprobadores.
- Capacidad de revisar detalles, agregar comentarios y estampar firma de aprobación.
- Opciones de Aprobar, Rechazar o marcar Para Revisión.

### 6. Gestión Financiera (Desembolsos y Cierre)
- Registro de fecha y notas de transferencia bancaria.
- Seguimiento de "Anticipos Abiertos" (dinero entregado pero no legalizado).
- Proceso de cierre formal tras la entrega de soportes.

### 7. Reportes y Exportación
- **Generación de PDF**: Creación de un formato oficial de FUNDAEC con logotipos, datos estructurados y firmas incrustadas.
- **Reportes Estadísticos**: Filtros por estado, proyecto y fechas.
- **Exportación CSV**: Descarga de data cruda para análisis externo en Excel.

### 8. Panel de Administración
- Gestión de usuarios y visualización de carga de trabajo.
- Herramientas de mantenimiento: Carga de datos de prueba (Seeding) y limpieza de base de datos local.
- Buscador global de anticipos por ID, nombre o concepto.

---
*Desarrollado para la eficiencia administrativa y transparencia financiera de FUNDAEC.*
