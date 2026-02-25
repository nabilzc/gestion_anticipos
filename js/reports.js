/**
 * REPORTS.JS — Módulo de reportes y estadísticas
 */

const Reports = {
  render() {
    const stats = DB.getStats();
    const todos = DB.getAll();

    // Por empleado (abiertos)
    const porEmpleado = stats.porEmpleado;
    const maxEmp = Math.max(1, ...Object.values(porEmpleado));

    // Por proyecto
    const porProyecto = stats.porProyecto;
    const maxProy = Math.max(1, ...Object.values(porProyecto).map(v => v.total));

    // Historial reciente (últimas 15 acciones)
    const historialAll = [];
    todos.forEach(a => {
      (a.historial || []).forEach(h => { historialAll.push({ ...h, antiId: a.id, nombre: a.solicitante.nombre }); });
    });
    historialAll.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const histReciente = historialAll.slice(0, 15);

    const formatMoney = n => `$ ${(parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
    const formatDate = d => d ? new Date(d).toLocaleDateString('es-CO') : '–';

    return `
      <div class="kpi-grid">
        <div class="kpi-card lime">
          <div class="kpi-icon lime"><i class="fa fa-list"></i></div>
          <div class="kpi-value">${stats.total}</div>
          <div class="kpi-label">Total de anticipos</div>
        </div>
        <div class="kpi-card yellow">
          <div class="kpi-icon yellow"><i class="fa fa-folder-open"></i></div>
          <div class="kpi-value">${stats.abiertos}</div>
          <div class="kpi-label">Anticipos abiertos</div>
        </div>
        <div class="kpi-card red">
          <div class="kpi-icon red"><i class="fa fa-clock"></i></div>
          <div class="kpi-value">${stats.vencidos}</div>
          <div class="kpi-label">Anticipos vencidos</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon green"><i class="fa fa-check-circle"></i></div>
          <div class="kpi-value">${stats.cerrados}</div>
          <div class="kpi-label">Cerrados / Legalizados</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-icon blue"><i class="fa fa-dollar-sign"></i></div>
          <div class="kpi-value money">${formatMoney(stats.totalDineroAbierto)}</div>
          <div class="kpi-label">Total en anticipos abiertos</div>
        </div>
        <div class="kpi-card lime">
          <div class="kpi-icon lime"><i class="fa fa-hourglass-half"></i></div>
          <div class="kpi-value">${stats.promDias}</div>
          <div class="kpi-label">Días prom. de legalización</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;" class="reports-grid">
        <!-- Anticipos abiertos por empleado -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Anticipos abiertos por empleado</div>
              <div class="card-subtitle">Solo en estado "Anticipo abierto"</div>
            </div>
          </div>
          <div class="card-body">
            ${Object.keys(porEmpleado).length === 0
        ? '<p class="text-muted text-sm">Sin datos</p>'
        : Object.entries(porEmpleado).map(([nombre, cant]) => `
                <div class="chart-bar-row" style="margin-bottom:10px;">
                  <div class="chart-bar-label">${nombre}</div>
                  <div class="chart-bar">
                    <div class="chart-bar-fill" style="width:${Math.round((cant / maxEmp) * 100)}%;background:var(--accent-dark)"></div>
                  </div>
                  <div class="chart-bar-val">${cant} anticipo${cant > 1 ? 's' : ''}</div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Por proyecto -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Anticipos por proyecto</div>
              <div class="card-subtitle">Total histórico</div>
            </div>
          </div>
          <div class="card-body">
            ${Object.keys(porProyecto).length === 0
        ? '<p class="text-muted text-sm">Sin datos</p>'
        : Object.entries(porProyecto).map(([proy, data]) => `
                <div class="chart-bar-row" style="margin-bottom:10px;">
                  <div class="chart-bar-label">${proy}</div>
                  <div class="chart-bar">
                    <div class="chart-bar-fill" style="width:${Math.round((data.total / maxProy) * 100)}%;background:var(--blue)"></div>
                  </div>
                  <div class="chart-bar-val">${formatMoney(data.total)}</div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>

      <!-- Tabla anticipos vencidos -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header">
          <div>
            <div class="card-title">Anticipos vencidos</div>
            <div class="card-subtitle">Fecha de ejecución superada en más de 3 días</div>
          </div>
          <button class="btn-secondary" onclick="App.exportarCSV()">
            <i class="fa fa-download"></i> Exportar CSV
          </button>
        </div>
        <div class="table-wrap">
          ${this._tablaVencidos()}
        </div>
      </div>

      <!-- Historial reciente -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Historial de actividad reciente</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Fecha</th><th>Anticipo</th><th>Solicitante</th><th>Acción</th><th>Estado</th>
            </tr></thead>
            <tbody>
              ${histReciente.length === 0
        ? `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Sin actividad registrada</div></div></td></tr>`
        : histReciente.map(h => `
                <tr>
                  <td>${formatDate(h.fecha)}</td>
                  <td><a href="#" onclick="App.navegarA('detalle','${h.antiId}');return false;" style="color:var(--accent-dark);font-weight:600;">${h.antiId}</a></td>
                  <td>${h.nombre || '–'}</td>
                  <td>${h.accion}</td>
                  <td>${h.estado ? this._badge(h.estado) : '–'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _tablaVencidos() {
    const vencidos = DB.getVencidos();
    if (vencidos.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">No hay anticipos vencidos. ¡Excelente!</div></div>`;
    }
    const formatMoney = n => `$ ${(parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
    return `<table>
      <thead><tr><th>ID</th><th>Solicitante</th><th>Proyecto</th><th>Valor</th><th>Días vencido</th><th>Acciones</th></tr></thead>
      <tbody>
        ${vencidos.map(a => {
      const dias = DB.diasVencidos(a);
      return `<tr>
            <td><a href="#" onclick="App.navegarA('detalle','${a.id}');return false;" style="color:var(--accent-dark);font-weight:700;">${a.id}</a></td>
            <td>${a.solicitante.nombre}</td>
            <td>${a.solicitante.proyecto || '–'}</td>
            <td style="font-weight:600;">${formatMoney(a.totalValor)}</td>
            <td><span class="alert-badge alert-red"><i class="fa fa-exclamation-triangle"></i> ${dias} días</span></td>
            <td>
              <button class="btn-icon" title="Ver detalle" onclick="App.navegarA('detalle','${a.id}')">
                <i class="fa fa-eye"></i>
              </button>
            </td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>`;
  },

  _badge(estado) {
    const map = {
      'Borrador': 'badge-borrador', 'Enviado': 'badge-enviado',
      'En revisión': 'badge-revision', 'Aprobado': 'badge-aprobado',
      'Aprobado con ajustes': 'badge-ajustes', 'Rechazado': 'badge-rechazado',
      'Desembolsado': 'badge-desembolsado', 'Anticipo abierto': 'badge-abierto',
      'Vencido': 'badge-vencido', 'Cerrado': 'badge-cerrado',
    };
    return `<span class="badge ${map[estado] || 'badge-borrador'}">${estado}</span>`;
  },

  exportarCSV() {
    const todos = DB.getAll();
    const cols = ['ID', 'Estado', 'Fecha', 'Solicitante', 'Cargo', 'Proyecto', 'Por Concepto De', 'Total', 'Entidad Bancaria', 'Fecha Ejecución'];
    const rows = todos.map(a => [
      a.id, a.estado, a.fecha, a.solicitante.nombre, a.solicitante.cargo,
      a.solicitante.proyecto, a.porConceptoDe, a.totalValor,
      (a.banco || {}).entidad, a.fechaEjecucion
    ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`));
    const csv = [cols.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'anticipos_fundaec.csv'; a.click();
    URL.revokeObjectURL(url);
    App.toast('CSV exportado exitosamente', 'success');
  }
};
