/**
 * DATA.JS — Capa de datos (localStorage)
 * Gestiona todos los anticipos con estructura relacional simulada.
 */

const DB = {
  KEY_ANTICIPOS: 'fundaec_anticipos',
  KEY_COUNTER: 'fundaec_counter',

  // ── CRUD básico ──────────────────────────────────────

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY_ANTICIPOS) || '[]');
    } catch { return []; }
  },

  save(anticipos) {
    localStorage.setItem(this.KEY_ANTICIPOS, JSON.stringify(anticipos));
  },

  getById(id) {
    return this.getAll().find(a => a.id === id) || null;
  },

  create(data) {
    const anticipos = this.getAll();
    const counter = (parseInt(localStorage.getItem(this.KEY_COUNTER) || '0')) + 1;
    localStorage.setItem(this.KEY_COUNTER, counter);
    const year = new Date().getFullYear();
    const id = `ANT-${year}-${String(counter).padStart(3, '0')}`;
    const anticipo = {
      id,
      estado: 'Borrador',
      fechaCreacion: new Date().toISOString(),
      fechaUltimaActualizacion: new Date().toISOString(),
      // Sección 1
      fecha: data.fecha || new Date().toLocaleDateString('es-CO'),
      // Sección 2
      solicitante: {
        nombre: data.nombre || '',
        tipoDocumento: data.tipoDocumento || 'CC',
        numeroDocumento: data.numeroDocumento || '',
        cargo: data.cargo || '',
        proyecto: data.proyecto || '',
        correo: data.correo || '',
        contacto: data.contacto || '',
      },
      // Sección 3
      porConceptoDe: data.porConceptoDe || '',
      gastos: data.gastos || [],
      totalValor: data.totalValor || 0,
      totalEnLetras: data.totalEnLetras || '',
      // Sección 4
      banco: {
        entidad: data.entidad || '',
        tipoCuenta: data.tipoCuenta || 'Ahorros',
        numeroCuenta: data.numeroCuenta || '',
      },
      // Sección 5
      observaciones: data.observaciones || '',
      fechaEjecucion: data.fechaEjecucion || '',
      // Sección 6
      firmasSolicitante: data.firmaSolicitante || null,
      firmaAprobador: null,
      // Flujo
      historial: [{
        fecha: new Date().toISOString(),
        accion: 'Solicitud creada como Borrador',
        usuario: data.correo || 'Sistema',
        estado: 'Borrador'
      }],
      comentarioAprobador: '',
      emailAprobador: '',
      fechaDesembolso: null,
    };
    anticipos.push(anticipo);
    this.save(anticipos);
    return anticipo;
  },

  update(id, changes) {
    const anticipos = this.getAll();
    const idx = anticipos.findIndex(a => a.id === id);
    if (idx === -1) return null;
    anticipos[idx] = { ...anticipos[idx], ...changes, fechaUltimaActualizacion: new Date().toISOString() };
    this.save(anticipos);
    return anticipos[idx];
  },

  addHistorial(id, accion, usuario, estado) {
    const a = this.getById(id);
    if (!a) return;
    const hist = a.historial || [];
    hist.push({ fecha: new Date().toISOString(), accion, usuario, estado });
    this.update(id, { historial: hist });
  },

  cambiarEstado(id, nuevoEstado, usuario, comentario = '') {
    const a = this.getById(id);
    if (!a) return null;
    this.update(id, { estado: nuevoEstado, comentarioAprobador: comentario });
    this.addHistorial(id, `Estado cambiado a "${nuevoEstado}"${comentario ? ': ' + comentario : ''}`, usuario, nuevoEstado);
    return this.getById(id);
  },

  delete(id) {
    const anticipos = this.getAll().filter(a => a.id !== id);
    this.save(anticipos);
  },

  // ── Consultas ────────────────────────────────────────

  getByEmail(email) {
    return this.getAll().filter(a => a.solicitante.correo === email);
  },

  getAbiertos(email) {
    return this.getByEmail(email).filter(a =>
      ['Anticipo abierto', 'Desembolsado', 'Aprobado', 'Aprobado con ajustes', 'Enviado', 'En revisión'].includes(a.estado)
    );
  },

  getAnticiposAbiertos() {
    return this.getAll().filter(a => a.estado === 'Anticipo abierto');
  },

  getVencidos() {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return this.getAll().filter(a => {
      if (a.estado !== 'Anticipo abierto') return false;
      if (!a.fechaEjecucion) return false;
      const fe = new Date(a.fechaEjecucion); fe.setHours(0, 0, 0, 0);
      const dias = Math.floor((hoy - fe) / 86400000);
      return dias > 3;
    });
  },

  getPendientesAprobacion() {
    return this.getAll().filter(a => ['Enviado', 'En revisión'].includes(a.estado));
  },

  // ── Regla de control de anticipos simultáneos ────────

  verificarLimite(emailSolicitante) {
    const abiertos = this.getAbiertos(emailSolicitante).length;
    if (abiertos >= 2) return { permitido: false, advertencia: false, cantidad: abiertos };
    if (abiertos === 1) return { permitido: true, advertencia: true, cantidad: abiertos };
    return { permitido: true, advertencia: false, cantidad: abiertos };
  },

  // ── Días vencidos ────────────────────────────────────

  diasVencidos(anticipo) {
    if (!anticipo.fechaEjecucion) return 0;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fe = new Date(anticipo.fechaEjecucion); fe.setHours(0, 0, 0, 0);
    return Math.floor((hoy - fe) / 86400000);
  },

  // ── Estadísticas para reportes ───────────────────────

  getStats() {
    const todos = this.getAll();
    const abiertos = todos.filter(a => a.estado === 'Anticipo abierto');
    const vencidos = this.getVencidos();
    const cerrados = todos.filter(a => a.estado === 'Cerrado');
    const totalDineroAbierto = abiertos.reduce((s, a) => s + (parseFloat(a.totalValor) || 0), 0);

    // Promedio días de legalización (desde creación a cierre)
    let promDias = 0;
    if (cerrados.length > 0) {
      const suma = cerrados.reduce((s, a) => {
        const inicio = new Date(a.fechaCreacion);
        const fin = new Date(a.fechaUltimaActualizacion);
        return s + Math.floor((fin - inicio) / 86400000);
      }, 0);
      promDias = Math.round(suma / cerrados.length);
    }

    // Abiertos por empleado
    const porEmpleado = {};
    abiertos.forEach(a => {
      const k = a.solicitante.nombre || a.solicitante.correo;
      porEmpleado[k] = (porEmpleado[k] || 0) + 1;
    });

    // Por proyecto
    const porProyecto = {};
    todos.forEach(a => {
      const k = a.solicitante.proyecto || 'Sin proyecto';
      if (!porProyecto[k]) porProyecto[k] = { cantidad: 0, total: 0 };
      porProyecto[k].cantidad++;
      porProyecto[k].total += parseFloat(a.totalValor) || 0;
    });

    return { total: todos.length, abiertos: abiertos.length, vencidos: vencidos.length, cerrados: cerrados.length, totalDineroAbierto, promDias, porEmpleado, porProyecto };
  },
};
