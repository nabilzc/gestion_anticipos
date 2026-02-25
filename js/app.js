/**
 * APP.JS — Router principal y controlador de la aplicación
 */

const App = {
  currentPage: 'dashboard',
  currentDetail: null,

  init() {
    // Login
    document.getElementById('login-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pwd = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Ingresando...';
      setTimeout(() => {
        const user = Auth.login(email, pwd);
        if (!user) {
          document.getElementById('login-error').textContent = 'Correo o contraseña incorrectos.';
          document.getElementById('login-error').classList.remove('hidden');
          btn.disabled = false;
          btn.innerHTML = '<span>Iniciar sesión</span><i class="fa fa-arrow-right"></i>';
        } else {
          this._showApp();
        }
      }, 700);
    });

    // Si ya hay sesión activa
    if (Auth.isLoggedIn()) this._showApp();

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      Auth.logout();
      document.getElementById('app').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('login-password').value = '';
    });

    // Notificaciones
    document.getElementById('notif-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('notif-panel');
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) Reminders.renderPanel();
    });
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notif-panel');
      if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target) && e.target.id !== 'notif-btn') {
        panel.classList.add('hidden');
      }
    });

    // Sidebar nav links
    document.querySelectorAll('.nav-item[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page && page !== 'ayuda') this.navegarA(page);
      });
    });

    // Búsqueda
    document.getElementById('topbar-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      if (q.length > 2) this._buscar(q);
    });
  },

  _showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    const session = Auth.getSession();

    // Actualizar sidebar con datos del usuario
    const initials = Auth.getInitials();
    document.getElementById('sidebar-avatar').textContent = initials;
    document.getElementById('topbar-avatar').textContent = initials;
    document.getElementById('sidebar-name').textContent = session.nombre;
    document.getElementById('sidebar-role').textContent = session.rol;
    document.getElementById('topbar-name').textContent = session.nombre.split(' ')[0];

    // Mostrar items de menú según rol
    if (Auth.can('ver_aprobaciones')) document.getElementById('nav-aprobaciones').style.display = '';
    if (Auth.can('desembolsar') || Auth.can('cerrar')) document.getElementById('nav-desembolsos').style.display = '';
    if (Auth.can('ver_reportes')) document.getElementById('nav-reportes').style.display = '';
    if (Auth.can('admin_panel')) document.getElementById('nav-admin-panel').style.display = '';
    if (!Auth.can('crear_solicitud')) document.getElementById('nav-nueva-solicitud').style.display = 'none';

    Reminders.actualizarUI();
    this.navegarA('dashboard');
  },

  navegarA(pagina, id = null) {
    this.currentPage = pagina;
    this.currentDetail = id;

    // Smooth transition
    const contentEl = document.getElementById('page-content');
    if (contentEl) {
      contentEl.classList.remove('fade-in');
      void contentEl.offsetWidth; // Trigger reflow
      contentEl.classList.add('fade-in');
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById(`nav-${pagina === 'detalle' ? 'mis-anticipos' : pagina}`);
    navEl?.classList.add('active');

    const pageTitles = {
      'dashboard': 'Dashboard',
      'nueva-solicitud': 'Nueva Solicitud',
      'mis-anticipos': 'Mis Anticipos',
      'aprobaciones': 'Aprobaciones',
      'desembolsos': 'Desembolsos',
      'reportes': 'Reportes',
      'detalle': 'Detalle del Anticipo',
      'admin-panel': 'Administración',
    };
    document.getElementById('page-title').textContent = pageTitles[pagina] || pagina;

    const content = document.getElementById('page-content');
    content.innerHTML = '';

    window.scrollTo(0, 0);
    Reminders.actualizarUI();

    switch (pagina) {
      case 'dashboard': this._renderDashboard(); break;
      case 'nueva-solicitud': this._renderNuevaSolicitud(); break;
      case 'mis-anticipos': this._renderMisAnticipos(); break;
      case 'aprobaciones': this._renderAprobaciones(); break;
      case 'desembolsos': this._renderDesembolsos(); break;
      case 'reportes': this._renderReportes(); break;
      case 'detalle': this._renderDetalle(id); break;
      case 'admin-panel': this._renderAdmin(); break;
      default: content.innerHTML = '<p class="text-muted">Página no encontrada.</p>';
    }
  },

  // ── DASHBOARD ────────────────────────────────────────
  _renderDashboard() {
    const session = Auth.getSession();
    const todos = Auth.can('ver_todos') ? DB.getAll() : DB.getByEmail(session.email);
    const stats = DB.getStats();
    const formatMoney = n => `$ ${(parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
    const recientes = [...todos].sort((a, b) => new Date(b.fechaUltimaActualizacion) - new Date(a.fechaUltimaActualizacion)).slice(0, 8);

    document.getElementById('page-content').innerHTML = `
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
        <div class="kpi-card blue"><div class="kpi-icon blue"><i class="fa fa-inbox"></i></div><div class="kpi-value">${todos.length}</div><div class="kpi-label">Total anticipos</div></div>
        <div class="kpi-card yellow"><div class="kpi-icon yellow"><i class="fa fa-folder-open"></i></div><div class="kpi-value">${todos.filter(a => a.estado === 'Anticipo abierto').length}</div><div class="kpi-label">Abiertos</div></div>
        <div class="kpi-card red"><div class="kpi-icon red"><i class="fa fa-clock"></i></div><div class="kpi-value">${DB.getVencidos().length}</div><div class="kpi-label">Vencidos</div></div>
        <div class="kpi-card lime"><div class="kpi-icon lime"><i class="fa fa-dollar-sign"></i></div><div class="kpi-value money">${formatMoney(stats.totalDineroAbierto)}</div><div class="kpi-label">En anticipos abiertos</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Anticipos recientes</div>
            <div class="card-subtitle">Actividad de los últimos anticipos</div>
          </div>
          ${Auth.can('crear_solicitud') ? `<button class="btn-primary accent" onclick="App.navegarA('nueva-solicitud')"><i class="fa fa-plus"></i> Nueva solicitud</button>` : ''}
        </div>
        <div class="table-wrap">${this._tablaAnticipos(recientes)}</div>
        ${todos.length > 8 ? `<div class="table-footer"><span class="table-count">Mostrando ${recientes.length} de ${todos.length}</span><button class="btn-secondary" onclick="App.navegarA('mis-anticipos')">Ver todos</button></div>` : ''}
      </div>
    `;
  },

  // ── NUEVA SOLICITUD ──────────────────────────────────
  _renderNuevaSolicitud() {
    if (!Auth.can('crear_solicitud')) { this._sinPermiso(); return; }
    document.getElementById('page-content').innerHTML = Form.render();
    Form.init();
  },

  // ── MIS ANTICIPOS ────────────────────────────────────
  _renderMisAnticipos() {
    const session = Auth.getSession();
    const todos = Auth.can('ver_todos') ? DB.getAll() : DB.getByEmail(session.email);
    const sorted = [...todos].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${Auth.can('ver_todos') ? 'Todos los anticipos' : 'Mis anticipos'}</div>
          ${Auth.can('crear_solicitud') ? `<button class="btn-primary accent" onclick="App.navegarA('nueva-solicitud')"><i class="fa fa-plus"></i> Nueva solicitud</button>` : ''}
        </div>
        <div class="table-wrap">${this._tablaAnticipos(sorted, true)}</div>
        <div class="table-footer"><span class="table-count">${sorted.length} solicitud(es) en total</span></div>
      </div>`;
  },

  // ── APROBACIONES ─────────────────────────────────────
  _renderAprobaciones() {
    if (!Auth.can('ver_aprobaciones')) { this._sinPermiso(); return; }
    const pendientes = DB.getPendientesAprobacion();
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Solicitudes para aprobar</div><div class="card-subtitle">${pendientes.length} pendiente(s)</div></div>
        </div>
        <div class="table-wrap">${this._tablaAnticipos(pendientes, true)}</div>
      </div>`;
  },

  // ── DESEMBOLSOS ──────────────────────────────────────
  _renderDesembolsos() {
    const aprobados = DB.getAll().filter(a => ['Aprobado', 'Aprobado con ajustes', 'Desembolsado', 'Anticipo abierto'].includes(a.estado));
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Gestión de desembolsos y cierres</div><div class="card-subtitle">Anticipos aprobados y abiertos</div></div>
        </div>
        <div class="table-wrap">${this._tablaAnticipos(aprobados, true)}</div>
      </div>`;
  },

  // ── REPORTES ─────────────────────────────────────────
  _renderReportes() {
    if (!Auth.can('ver_reportes')) { this._sinPermiso(); return; }
    document.getElementById('page-content').innerHTML = Reports.render();
  },

  exportarCSV() { Reports.exportarCSV(); },

  // ── ADMIN ────────────────────────────────────────────
  _renderAdmin() {
    const users = Auth.getAllUsers();
    const allAntic = DB.getAll();
    document.getElementById('page-content').innerHTML = `
      <div class="card" style="max-width:700px;">
        <div class="card-header"><div class="card-title">Usuarios del sistema</div></div>
        <div class="card-body">
          ${users.map(u => `
            <div class="admin-user-card">
              <div class="user-avatar" style="background:var(--accent);color:var(--sidebar-bg);">${u.nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}</div>
              <div class="admin-user-info">
                <div class="admin-user-name">${u.nombre} <span class="badge badge-${u.rol === 'Empleado' ? 'enviado' : u.rol === 'Aprobador' ? 'aprobado' : u.rol === 'Finanzas' ? 'desembolsado' : 'borrador'}" style="margin-left:6px;">${u.rol}</span></div>
                <div class="admin-user-email">${u.email} — ${u.cargo}</div>
              </div>
              <div style="font-size:12px;color:var(--text-muted);">${DB.getByEmail(u.email).length} antic.</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="card" style="max-width:700px;margin-top:0;">
        <div class="card-header">
          <div class="card-title">Gestión de datos</div>
        </div>
        <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn-secondary" onclick="App._seedData()"><i class="fa fa-database"></i> Cargar datos de prueba</button>
          <button class="btn-danger" onclick="App._clearData()"><i class="fa fa-trash"></i> Borrar todos los datos</button>
          <button class="btn-secondary" onclick="App.exportarCSV()"><i class="fa fa-download"></i> Exportar CSV</button>
        </div>
      </div>`;
  },

  // ── DETALLE ──────────────────────────────────────────
  _renderDetalle(id) {
    const a = DB.getById(id);
    if (!a) { document.getElementById('page-content').innerHTML = '<p class="text-muted">Anticipo no encontrado.</p>'; return; }

    const session = Auth.getSession();
    const formatMoney = n => `$ ${(parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
    const formatDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '–';
    const alerta = Reminders.calcularAlerta(a);

    // Botones de acción según estado y rol
    let acciones = '';
    if (a.estado === 'Borrador' && a.solicitante.correo === session.email) {
      acciones += `<button class="btn-primary accent" onclick="App._enviarSolicitud('${a.id}')"><i class="fa fa-paper-plane"></i> Enviar</button>`;
      acciones += `<button class="btn-danger" onclick="App._eliminarSolicitud('${a.id}')"><i class="fa fa-trash"></i> Eliminar</button>`;
    }
    if (['Enviado', 'En revisión'].includes(a.estado) && Auth.can('aprobar')) {
      acciones += `<button class="btn-primary" onclick="App._abrirModalAprobacion('${a.id}')"><i class="fa fa-clipboard-check"></i> Gestionar aprobación</button>`;
    }
    if (a.estado === 'Aprobado' || a.estado === 'Aprobado con ajustes') {
      if (Auth.can('desembolsar')) acciones += `<button class="btn-primary" onclick="App._desembolsar('${a.id}')"><i class="fa fa-money-bill-transfer"></i> Registrar desembolso</button>`;
    }
    if (a.estado === 'Desembolsado' && Auth.can('desembolsar')) {
      acciones += `<button class="btn-primary" onclick="App._marcarAbierto('${a.id}')"><i class="fa fa-folder-open"></i> Marcar anticipo abierto</button>`;
    }
    if (['Anticipo abierto', 'Vencido'].includes(a.estado) && Auth.can('cerrar')) {
      acciones += `<button class="btn-primary" onclick="App._abrirModalFirmaYCerrar('${a.id}')"><i class="fa fa-circle-check"></i> Cerrar anticipo</button>`;
    }
    // PDF siempre disponible
    acciones += `<button class="btn-secondary" onclick="PDF.generar(DB.getById('${a.id}'))"><i class="fa fa-file-pdf"></i> Descargar PDF</button>`;

    document.getElementById('page-content').innerHTML = `
      <div style="max-width:820px;margin:0 auto;">
        <div class="detail-header">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <div class="detail-id">${a.id}</div>
            ${this._badge(a.estado)}
            ${alerta.nivel !== 'none' ? Reminders.badgeHTML(a) : ''}
          </div>
          <div class="detail-meta">
            <span><i class="fa fa-calendar"></i> Creado: ${a.fecha}</span>
            <span><i class="fa fa-user"></i> ${a.solicitante.nombre}</span>
            <span><i class="fa fa-briefcase"></i> ${a.solicitante.proyecto || '–'}</span>
          </div>
        </div>

        <!-- Acciones -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px;">${acciones}</div>

        <!-- Datos solicitante -->
        <div class="card">
          <div class="card-header"><div class="card-title">Información del solicitante</div></div>
          <div class="card-body">
            <div class="detail-grid">
              ${this._detailField('Nombre', a.solicitante.nombre)}
              ${this._detailField('Documento', `${a.solicitante.tipoDocumento} ${a.solicitante.numeroDocumento}`)}
              ${this._detailField('Cargo', a.solicitante.cargo)}
              ${this._detailField('Proyecto', a.solicitante.proyecto)}
              ${this._detailField('Correo', a.solicitante.correo)}
              ${this._detailField('Contacto', a.solicitante.contacto)}
            </div>
          </div>
        </div>

        <!-- Anticipo -->
        <div class="card">
          <div class="card-header"><div class="card-title">Información del anticipo</div></div>
          <div class="card-body">
            <div style="margin-bottom:14px;">
              <div class="detail-field-label">Por concepto de</div>
              <div class="detail-field-value" style="margin-top:4px;">${a.porConceptoDe || '–'}</div>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Tipo de gasto</th><th>Código</th><th>Descripción</th><th style="text-align:right;">Valor</th></tr></thead>
                <tbody>
                  ${(a.gastos || []).map(g => `<tr><td>${g.tipoGasto || '–'}</td><td>${g.codigo || '–'}</td><td>${g.descripcion || '–'}</td><td style="text-align:right;font-weight:600;">${formatMoney(g.valor)}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div class="total-row" style="margin-top:12px;">
              <div>
                <div style="font-size:11px;font-weight:600;color:var(--text-muted);">TOTAL</div>
                <div style="font-size:12px;color:var(--text-muted);font-style:italic;margin-top:2px;">Son: ${a.totalEnLetras || '–'}</div>
              </div>
              <div style="font-size:20px;font-weight:800;">${formatMoney(a.totalValor)}</div>
            </div>
          </div>
        </div>

        <!-- Banco y Fecha de Ejecución -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div class="card">
            <div class="card-header"><div class="card-title">Datos bancarios</div></div>
            <div class="card-body">
              ${this._detailField('Entidad', (a.banco || {}).entidad)}
              <div style="margin-top:12px;">${this._detailField('Tipo de cuenta', (a.banco || {}).tipoCuenta)}</div>
              <div style="margin-top:12px;">${this._detailField('Número de cuenta', (a.banco || {}).numeroCuenta)}</div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">Fecha de ejecución</div></div>
            <div class="card-body">
              <div style="margin-top:4px;">${this._detailField('Fecha estimada de ejecución', formatDate(a.fechaEjecucion))}</div>
            </div>
          </div>
        </div>

        <!-- Firmas -->
        <div class="card">
          <div class="card-header"><div class="card-title">Firmas</div></div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div>
              <div class="detail-field-label" style="margin-bottom:8px;">Firma del solicitante</div>
              ${a.firmasSolicitante ? `<img src="${a.firmasSolicitante}" style="max-height:80px;max-width:100%;border-radius:6px;border:1.5px solid var(--border);" alt="Firma solicitante"/>` : '<span class="text-muted text-sm">Sin firma cargada</span>'}
            </div>
            <div>
              <div class="detail-field-label" style="margin-bottom:8px;">Firma del aprobador</div>
              ${a.firmaAprobador ? `<img src="${a.firmaAprobador}" style="max-height:80px;max-width:100%;border-radius:6px;border:1.5px solid var(--border);" alt="Firma aprobador"/>` : '<span class="text-muted text-sm">Pendiente de aprobación</span>'}
            </div>
          </div>
        </div>

        <!-- Historial -->
        <div class="card">
          <div class="card-header"><div class="card-title">Historial de estados</div></div>
          <div class="card-body" style="max-height:300px;overflow-y:auto;">
            ${(a.historial || []).slice().reverse().map(h => `
              <div class="hist-item">
                <div class="hist-dot"></div>
                <div style="flex:1;">
                  <div class="hist-text">${h.accion}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${h.usuario} · ${new Date(h.fecha).toLocaleString('es-CO')}</div>
                </div>
                ${h.estado ? `<div>${this._badge(h.estado)}</div>` : ''}
              </div>`).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ── ACCIONES DE ESTADO ───────────────────────────────

  _enviarSolicitud(id) {
    const session = Auth.getSession();
    DB.cambiarEstado(id, 'Enviado', session.nombre);
    this.toast('Solicitud enviada exitosamente ✅', 'success');
    this._renderDetalle(id);
    Reminders.actualizarUI();
  },

  _eliminarSolicitud(id) {
    if (!confirm('¿Estás seguro de eliminar esta solicitud en estado Borrador?')) return;
    DB.delete(id);
    this.toast('Solicitud eliminada', 'info');
    this.navegarA('mis-anticipos');
  },

  _abrirModalAprobacion(id) {
    const a = DB.getById(id);
    if (!a) return;
    document.getElementById('modal-content').innerHTML = `
      <div class="modal-title">Gestionar aprobación — ${a.id}</div>
      <div class="modal-body">
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Selecciona la acción a tomar:</p>
        <div class="estado-opciones">
          <div class="estado-option" onclick="App._selEstado(this,'En revisión')">
            <div class="estado-option-icon">🔍</div>
            <div class="estado-option-text"><strong>En revisión</strong></div>
          </div>
          <div class="estado-option" onclick="App._selEstado(this,'Aprobado')">
            <div class="estado-option-icon">✅</div>
            <div class="estado-option-text"><strong>Aprobar</strong></div>
          </div>
          <div class="estado-option" onclick="App._selEstado(this,'Rechazado')">
            <div class="estado-option-icon">❌</div>
            <div class="estado-option-text"><strong>Rechazar</strong></div>
          </div>
        </div>
        <div class="form-group" style="margin-top:18px;">
          <label class="form-label">Comentario del aprobador</label>
          <textarea class="form-control" id="modal-comentario" rows="2" placeholder="Comentarios..."></textarea>
        </div>
        <div style="margin-top:16px;">
          <label class="form-label" style="margin-bottom:8px;">Firma del aprobador</label>
          <div class="signature-tabs">
            <div class="signature-tab active" id="modal-tab-upload">Subir</div>
            <div class="signature-tab" id="modal-tab-draw">Dibujar</div>
          </div>
          <div id="modal-firma-upload-cont">
            <div class="file-upload-area" id="modal-firma-area" style="padding:14px;">
              <input type="file" id="modal-firma-input" accept="image/*" />
              <div class="file-upload-text" style="font-size:11px;"><i class="fa fa-upload"></i> Cargar imagen</div>
            </div>
          </div>
          <div id="modal-firma-draw-cont" class="hidden">
            <div class="signature-pad-container" style="height:120px;">
              <canvas id="modal-firma-canvas" class="signature-pad-canvas"></canvas>
              <div class="signature-pad-actions">
                <button type="button" class="btn-clear" id="modal-btn-clear" title="Limpiar"><i class="fa fa-eraser"></i></button>
              </div>
            </div>
          </div>
          <img id="modal-firma-preview" style="display:none;max-height:60px;max-width:100%;margin-top:8px;border-radius:4px;border:1px solid var(--border);" alt="Firma"/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="App.cerrarModal()">Cancelar</button>
        <button class="btn-primary" onclick="App._confirmarAprobacion('${id}')">Confirmar</button>
      </div>`;

    // Tabs
    const tUp = document.getElementById('modal-tab-upload');
    const tDw = document.getElementById('modal-tab-draw');
    const cUp = document.getElementById('modal-firma-upload-cont');
    const cDw = document.getElementById('modal-firma-draw-cont');

    tUp.onclick = () => { tUp.classList.add('active'); tDw.classList.remove('active'); cUp.classList.remove('hidden'); cDw.classList.add('hidden'); };
    tDw.onclick = () => { tDw.classList.add('active'); tUp.classList.remove('active'); cDw.classList.remove('hidden'); cUp.classList.add('hidden'); this._initModalCanvas(); };

    document.getElementById('modal-firma-input')?.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        this._modalFirmaAprobadorData = ev.target.result;
        const prev = document.getElementById('modal-firma-preview');
        prev.src = ev.target.result; prev.style.display = 'block';
        document.getElementById('modal-firma-area').classList.add('has-file');
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('modal-btn-clear')?.addEventListener('click', () => {
      const canv = document.getElementById('modal-firma-canvas');
      const ctx = canv.getContext('2d');
      ctx.clearRect(0, 0, canv.width, canv.height);
      this._modalFirmaAprobadorData = null;
      document.getElementById('modal-firma-preview').style.display = 'none';
    });

    this._modalFirmaAprobadorData = null;
    this._modalEstadoSel = null;
    this.abrirModal();
  },

  _initModalCanvas() {
    const canvas = document.getElementById('modal-firma-canvas');
    if (!canvas || canvas.dataset.initialized) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px';
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
    let drawing = false; let lastX = 0; let lastY = 0;
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return [cx - r.left, cy - r.top];
    };
    const start = (e) => { drawing = true;[lastX, lastY] = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); e.preventDefault(); };
    const draw = (e) => { if (!drawing) return; const [x, y] = getPos(e); ctx.lineTo(x, y); ctx.stroke();[lastX, lastY] = [x, y]; e.preventDefault(); };
    const stop = () => { if (!drawing) return; drawing = false; this._modalFirmaAprobadorData = canvas.toDataURL(); document.getElementById('modal-firma-preview').src = this._modalFirmaAprobadorData; document.getElementById('modal-firma-preview').style.display = 'block'; };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw); window.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false }); canvas.addEventListener('touchend', stop);
    canvas.dataset.initialized = "true";
  },

  _selEstado(el, estado) {
    document.querySelectorAll('.estado-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this._modalEstadoSel = estado;
  },

  _confirmarAprobacion(id) {
    if (!this._modalEstadoSel) { this.toast('Selecciona una acción', 'error'); return; }
    const session = Auth.getSession();
    const comentario = document.getElementById('modal-comentario')?.value || '';
    DB.cambiarEstado(id, this._modalEstadoSel, session.nombre, comentario);
    if (this._modalFirmaAprobadorData) {
      DB.update(id, { firmaAprobador: this._modalFirmaAprobadorData });
    }
    DB.update(id, { emailAprobador: session.email });
    this.cerrarModal();
    this.toast(`Estado cambiado a "${this._modalEstadoSel}" ✅`, 'success');
    this._renderDetalle(id);
    Reminders.actualizarUI();
  },

  _desembolsar(id) {
    const session = Auth.getSession();
    const a = DB.getById(id);
    const formatMoney = n => `$ ${(parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
    document.getElementById('modal-content').innerHTML = `
      <div class="modal-title">Registrar desembolso — ${id}</div>
      <div class="modal-body">
        <div style="background:var(--green-light);border:1.5px solid var(--green);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;">
          <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">Monto a desembolsar:</div>
          <div style="font-size:22px;font-weight:800;color:var(--green);">${formatMoney(a.totalValor)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${a.totalEnLetras}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Beneficiario</label>
          <input type="text" class="form-control" value="${a.solicitante.nombre}" readonly style="background:var(--bg);" />
        </div>
        <div class="form-group" style="margin-top:12px;">
          <label class="form-label">Entidad bancaria / Cuenta</label>
          <input type="text" class="form-control" value="${(a.banco || {}).entidad || '–'} · ${(a.banco || {}).tipoCuenta || ''} ${(a.banco || {}).numeroCuenta || ''}" readonly style="background:var(--bg);" />
        </div>
        <div class="form-group" style="margin-top:12px;">
          <label class="form-label">Fecha de desembolso</label>
          <input type="date" class="form-control" id="modal-fecha-desembolso" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group" style="margin-top:12px;">
          <label class="form-label">Notas de finanzas</label>
          <textarea class="form-control" id="modal-notas-desembolso" rows="2" placeholder="Número de transferencia..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="App.cerrarModal()">Cancelar</button>
        <button class="btn-primary" onclick="App._confirmarDesembolso('${id}')"><i class="fa fa-money-bill-transfer"></i> Confirmar desembolso</button>
      </div>`;
    this.abrirModal();
  },

  _confirmarDesembolso(id) {
    const session = Auth.getSession();
    const fecha = document.getElementById('modal-fecha-desembolso')?.value || new Date().toISOString().split('T')[0];
    const notas = document.getElementById('modal-notas-desembolso')?.value || '';
    DB.cambiarEstado(id, 'Desembolsado', session.nombre, `Desembolso registrado el ${fecha}. ${notas}`);
    DB.update(id, { fechaDesembolso: fecha });
    this.cerrarModal();
    this.toast('Desembolso registrado ✅', 'success');
    this._renderDetalle(id);
    Reminders.actualizarUI();
  },

  _marcarAbierto(id) {
    const session = Auth.getSession();
    DB.cambiarEstado(id, 'Anticipo abierto', session.nombre);
    this.toast('Anticipo marcado como abierto.', 'info');
    this._renderDetalle(id);
    Reminders.actualizarUI();
  },

  _abrirModalFirmaYCerrar(id) {
    document.getElementById('modal-content').innerHTML = `
      <div class="modal-title">Cerrar anticipo — ${id}</div>
      <div class="modal-body">
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Confirma el cierre del anticipo. Esta acción indica que el empleado legalizó el gasto correctamente.</p>
        <div class="form-group">
          <label class="form-label">Comentario de cierre</label>
          <textarea class="form-control" id="modal-comentario-cierre" rows="3" placeholder="Comentarios del cierre, documentos entregados, etc."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="App.cerrarModal()">Cancelar</button>
        <button class="btn-primary" style="background:var(--green);" onclick="App._confirmarCierre('${id}')"><i class="fa fa-circle-check"></i> Cerrar anticipo</button>
      </div>`;
    this.abrirModal();
  },

  _confirmarCierre(id) {
    const session = Auth.getSession();
    const comentario = document.getElementById('modal-comentario-cierre')?.value || '';
    DB.cambiarEstado(id, 'Cerrado', session.nombre, comentario || 'Anticipo cerrado y legalizado.');
    this.cerrarModal();
    this.toast('Anticipo cerrado exitosamente 🎉', 'success');
    this._renderDetalle(id);
    Reminders.actualizarUI();
  },

  // ── TABLA DE ANTICIPOS ───────────────────────────────
  _tablaAnticipos(lista, showFilters = false) {
    const formatMoney = n => `$ ${(parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
    if (!lista || lista.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No hay anticipos para mostrar</div>
        ${Auth.can('crear_solicitud') ? `<div style="margin-top:14px;"><button class="btn-primary accent" onclick="App.navegarA('nueva-solicitud')"><i class="fa fa-plus"></i> Nueva solicitud</button></div>` : ''}
      </div>`;
    }
    return `<table>
      <thead><tr>
        <th>ID</th><th>Solicitante</th><th>Concepto</th><th>Valor</th>
        <th>Fecha ejec.</th><th>Estado</th><th>Alerta</th><th></th>
      </tr></thead>
      <tbody>
        ${lista.map(a => {
      const alerta = Reminders.calcularAlerta(a);
      return `<tr>
            <td><a href="#" onclick="App.navegarA('detalle','${a.id}');return false;" style="color:var(--accent-dark);font-weight:700;">${a.id}</a></td>
            <td>${a.solicitante.nombre}</td>
            <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.porConceptoDe || '–'}</td>
            <td style="font-weight:600;">${formatMoney(a.totalValor)}</td>
            <td>${a.fechaEjecucion ? new Date(a.fechaEjecucion + 'T00:00:00').toLocaleDateString('es-CO') : '–'}</td>
            <td>${this._badge(a.estado)}</td>
            <td>${alerta.nivel !== 'none' ? Reminders.badgeHTML(a) : ''}</td>
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

  // ── BÚSQUEDA ─────────────────────────────────────────
  _buscar(query) {
    const session = Auth.getSession();
    const todos = Auth.can('ver_todos') ? DB.getAll() : DB.getByEmail(session.email);
    const results = todos.filter(a =>
      a.id.toLowerCase().includes(query) ||
      a.solicitante.nombre.toLowerCase().includes(query) ||
      (a.porConceptoDe || '').toLowerCase().includes(query) ||
      (a.solicitante.proyecto || '').toLowerCase().includes(query)
    );
    this.currentPage = 'mis-anticipos';
    document.getElementById('page-title').textContent = `Resultados: "${query}"`;
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">${results.length} resultado(s) para "${query}"</div></div>
        <div class="table-wrap">${this._tablaAnticipos(results)}</div>
      </div>`;
  },

  // ── MODAL ─────────────────────────────────────────────
  abrirModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
  },
  cerrarModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
  },

  // ── TOAST ─────────────────────────────────────────────
  toast(msg, type = 'info') {
    const iconMap = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa ${iconMap[type]} toast-icon"></i><span class="toast-msg">${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 300); }, 3500);
  },

  // ── HELPERS ───────────────────────────────────────────
  _detailField(label, value) {
    return `<div class="detail-field"><div class="detail-field-label">${label}</div><div class="detail-field-value">${value || '–'}</div></div>`;
  },

  _badge(estado) {
    const map = {
      'Borrador': 'badge-borrador', 'Enviado': 'badge-enviado', 'En revisión': 'badge-revision',
      'Aprobado': 'badge-aprobado', 'Aprobado con ajustes': 'badge-ajustes', 'Rechazado': 'badge-rechazado',
      'Desembolsado': 'badge-desembolsado', 'Anticipo abierto': 'badge-abierto', 'Vencido': 'badge-vencido', 'Cerrado': 'badge-cerrado',
    };
    return `<span class="badge ${map[estado] || 'badge-borrador'}">${estado}</span>`;
  },

  _sinPermiso() {
    document.getElementById('page-content').innerHTML = `
      <div style="text-align:center;padding:60px;"><div style="font-size:48px;margin-bottom:16px;">🔒</div>
      <h3 style="font-weight:700;color:var(--text-primary);margin-bottom:8px;">Sin permiso</h3>
      <p style="color:var(--text-muted);">No tienes acceso a esta sección.</p></div>`;
  },

  // ── DATOS DE PRUEBA ───────────────────────────────────
  _seedData() {
    const today = new Date();
    const dateStr = d => {
      const dt = new Date(today); dt.setDate(dt.getDate() + d);
      return dt.toISOString().split('T')[0];
    };
    const datos = [
      {
        nombre: 'Carlos Mejía', correo: 'empleado@fundaec.org', cargo: 'Coordinador de Campo', proyecto: 'Programa Rural Andino',
        porConceptoDe: 'Gastos de viaje y materiales para visitas de campo región Andina',
        gastos: [{ tipoGasto: 'Viáticos', codigo: 'V-001', descripcion: 'Alimentación 3 días', valor: 150000 }, { tipoGasto: 'Transporte', codigo: 'T-001', descripcion: 'Buses intermunicipales', valor: 80000 }],
        entidad: 'Bancolombia', tipoCuenta: 'Ahorros', numeroCuenta: '1234567890',
        fechaEjecucion: dateStr(-5), estado: 'Anticipo abierto'
      },
      {
        nombre: 'María González', correo: 'maria@fundaec.org', cargo: 'Educadora', proyecto: 'Programa Educativo Sur',
        porConceptoDe: 'Compra de materiales educativos y papelería para talleres',
        gastos: [{ tipoGasto: 'Materiales', codigo: 'M-001', descripcion: 'Cuadernos y lapiceros', valor: 220000 }, { tipoGasto: 'Materiales', codigo: 'M-002', descripcion: 'Cartulinas y marcadores', valor: 85000 }],
        entidad: 'Davivienda', tipoCuenta: 'Ahorros', numeroCuenta: '9876543210',
        fechaEjecucion: dateStr(5), estado: 'Aprobado'
      },
      {
        nombre: 'Pedro Castro', correo: 'pedro@fundaec.org', cargo: 'Promotor', proyecto: 'Programa Rural Andino',
        porConceptoDe: 'Gastos de transporte y comunicaciones para jornada comunitaria',
        gastos: [{ tipoGasto: 'Transporte', codigo: 'T-002', descripcion: 'Flete de chiva', valor: 350000 }],
        entidad: 'Nequi', tipoCuenta: 'Ahorros', numeroCuenta: '3001234567',
        fechaEjecucion: dateStr(2), estado: 'Cerrado'
      },
    ];
    datos.forEach(d => {
      const total = (d.gastos || []).reduce((s, g) => s + g.valor, 0);
      const anticipo = DB.create({
        ...d, tipoDocumento: 'CC', numeroDocumento: '1234567', contacto: '3001234567',
        totalValor: total, totalEnLetras: Form._numToLetras ? Form._numToLetras(total) : `${total} pesos`
      });
      if (d.estado !== 'Borrador') DB.cambiarEstado(anticipo.id, 'Enviado', d.nombre);
      if (['Aprobado', 'Anticipo abierto', 'Cerrado'].includes(d.estado)) DB.cambiarEstado(anticipo.id, 'Aprobado', 'Lucía Fernández');
      if (['Anticipo abierto', 'Cerrado'].includes(d.estado)) { DB.cambiarEstado(anticipo.id, 'Desembolsado', 'Andrés Rodríguez'); DB.cambiarEstado(anticipo.id, 'Anticipo abierto', 'Andrés Rodríguez'); }
      if (d.estado === 'Cerrado') DB.cambiarEstado(anticipo.id, 'Cerrado', 'Andrés Rodríguez', 'Legalizado con facturas entregadas.');
    });
    this.toast('Datos de prueba cargados ✅', 'success');
    this.navegarA('dashboard');
  },

  _clearData() {
    if (!confirm('¿Borrar TODOS los anticipos? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem(DB.KEY_ANTICIPOS);
    localStorage.removeItem(DB.KEY_COUNTER);
    this.toast('Datos borrados', 'warning');
    this.navegarA('dashboard');
  },
};

// ── Arrancar la app ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  // Cerrar modal con click fuera
  document.getElementById('modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'modal-overlay') App.cerrarModal(); });
  document.getElementById('modal-close')?.addEventListener('click', () => App.cerrarModal());
});
