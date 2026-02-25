/**
 * FORM.JS — Formulario multi-sección de solicitud de anticipo
 */

const Form = {
  _firmaSolicitanteData: null,
  _gastoId: 0,

  render() {
    const session = Auth.getSession();
    // Verificar límite de anticipos
    const limite = DB.verificarLimite(session.email);
    if (!limite.permitido) {
      return `
        <div style="max-width:600px;margin:40px auto;text-align:center;">
          <div style="font-size:60px;margin-bottom:20px;">🚫</div>
          <h2 style="font-weight:800;color:var(--text-primary);margin-bottom:10px;">Nuevas solicitudes bloqueadas</h2>
          <p style="color:var(--text-muted);margin-bottom:20px;">Tienes <strong>${limite.cantidad} anticipos abiertos</strong>. Debes cerrar al menos uno antes de solicitar un nuevo anticipo.</p>
          <button class="btn-primary" onclick="App.navegarA('mis-anticipos')">
            <i class="fa fa-list-check"></i> Ver mis anticipos
          </button>
        </div>`;
    }

    const advertencia = limite.advertencia
      ? `<div style="background:var(--yellow-light);border:1.5px solid var(--yellow);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
           <i class="fa fa-triangle-exclamation" style="color:var(--yellow);font-size:18px;"></i>
           <div><strong style="color:#854d0e;">Advertencia:</strong> Tienes 1 anticipo abierto. El aprobador será notificado automáticamente.</div>
         </div>` : '';

    const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const proyectos = ['Programa Rural Andino', 'Programa Educativo Sur', 'Programa Urbano Norte', 'Administración', 'Proyecto CEBV', 'Proyecto Tutores', 'Otro'];
    const tiposGasto = ['Viáticos', 'Transporte', 'Materiales', 'Alimentación', 'Hospedaje', 'Servicios', 'Comunicaciones', 'Otros'];

    return `
      <div style="max-width:820px;margin:0 auto;" id="form-anticipo-wrap">
        ${advertencia}
        <form id="form-anticipo" novalidate>

          <!-- S1: Fecha -->
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-num">1</div>
              <div class="form-section-title">Fecha de la solicitud</div>
            </div>
            <div class="form-section-body">
              <div class="form-group" style="max-width:280px;">
                <label class="form-label">Fecha</label>
                <input type="text" class="form-control" id="f-fecha" value="${hoy}" readonly style="background:var(--bg);" />
              </div>
            </div>
          </div>

          <!-- S2: Datos del solicitante -->
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-num">2</div>
              <div class="form-section-title">Información del solicitante</div>
            </div>
            <div class="form-section-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Nombre completo<span class="req">*</span></label>
                  <input type="text" class="form-control" id="f-nombre" value="${session.nombre}" readonly style="background:var(--bg);" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo de documento<span class="req">*</span></label>
                  <select class="form-control" id="f-tipo-doc">
                    <option value="CC">CC – Cédula de Ciudadanía</option>
                    <option value="CE">CE – Cédula de Extranjería</option>
                    <option value="PA">PA – Pasaporte</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Número de documento<span class="req">*</span></label>
                  <input type="text" class="form-control" id="f-num-doc" placeholder="Ej: 1234567890" />
                </div>
                <div class="form-group">
                  <label class="form-label">Cargo</label>
                  <input type="text" class="form-control" id="f-cargo" value="${session.cargo || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Proyecto / Programa<span class="req">*</span></label>
                  <select class="form-control" id="f-proyecto">
                    <option value="">— Seleccione —</option>
                    ${proyectos.map(p => `<option value="${p}"${session.proyecto === p ? ' selected' : ''}>${p}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Correo electrónico</label>
                  <input type="email" class="form-control" id="f-correo" value="${session.email}" readonly style="background:var(--bg);" />
                </div>
                <div class="form-group">
                  <label class="form-label">Número de contacto<span class="req">*</span></label>
                  <input type="tel" class="form-control" id="f-contacto" placeholder="Ej: 3001234567" />
                </div>
              </div>
            </div>
          </div>

          <!-- S3: Información del anticipo -->
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-num">3</div>
              <div class="form-section-title">Información del anticipo</div>
            </div>
            <div class="form-section-body">
              <div class="form-group form-group-full" style="margin-bottom:18px;">
                <label class="form-label">Por concepto de<span class="req">*</span></label>
                <textarea class="form-control" id="f-concepto" rows="2" placeholder="Describa el concepto general del anticipo..."></textarea>
              </div>

              <div class="gastos-table-wrap">
                <table class="gastos-table" id="gastos-table">
                  <thead>
                    <tr>
                      <th>Tipo de gasto</th>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Valor ($)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="gastos-body">
                    <!-- filas dinámicas -->
                  </tbody>
                </table>
              </div>
              <button type="button" class="btn-secondary" id="add-gasto-btn" style="margin-top:10px;font-size:13px;">
                <i class="fa fa-plus"></i> Agregar ítem
              </button>

              <div class="total-row" style="margin-top:14px;">
                <div>
                  <div style="font-size:12px;font-weight:600;color:var(--text-muted);">VALOR TOTAL DEL ANTICIPO</div>
                  <div class="total-letters" id="total-letras">Cero pesos</div>
                </div>
                <div class="total-value" id="total-display">$ 0</div>
              </div>
            </div>
          </div>

          <!-- S4: Información bancaria -->
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-num">4</div>
              <div class="form-section-title">Información para el pago</div>
            </div>
            <div class="form-section-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Entidad bancaria<span class="req">*</span></label>
                  <select class="form-control" id="f-banco">
                    <option value="">— Seleccione —</option>
                    <option>Bancolombia</option>
                    <option>Davivienda</option>
                    <option>Banco de Bogotá</option>
                    <option>BBVA</option>
                    <option>Nequi</option>
                    <option>Daviplata</option>
                    <option>Banco Popular</option>
                    <option>Scotiabank Colpatria</option>
                    <option>Banco AV Villas</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo de cuenta<span class="req">*</span></label>
                  <select class="form-control" id="f-tipo-cuenta">
                    <option value="Ahorros">Cuenta de Ahorros</option>
                    <option value="Corriente">Cuenta Corriente</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Número de cuenta<span class="req">*</span></label>
                  <input type="text" class="form-control" id="f-num-cuenta" placeholder="Ej: 12345678901" />
                </div>
              </div>
            </div>
          </div>

          <!-- S5: Observaciones -->
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-num">5</div>
              <div class="form-section-title">Observaciones y fecha de ejecución</div>
            </div>
            <div class="form-section-body">
              <div class="form-grid">
                <div class="form-group form-group-full">
                  <label class="form-label">Observaciones<span class="req">*</span></label>
                  <textarea class="form-control" id="f-observaciones" rows="3" placeholder="Detalle el uso previsto del anticipo, justificación y cualquier información relevante..."></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha estimada de ejecución del gasto<span class="req">*</span></label>
                  <input type="date" class="form-control" id="f-fecha-ejecucion" min="${new Date().toISOString().split('T')[0]}" />
                </div>
              </div>
            </div>
          </div>

          <!-- S6: Firma del solicitante -->
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-num">6</div>
              <div class="form-section-title">Firma del solicitante</div>
            </div>
            <div class="form-section-body">
              <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px;">Proporciona tu firma para el documento oficial. Puedes subir una imagen o dibujarla directamente.</p>
              
              <div class="signature-tabs">
                <div class="signature-tab active" data-tab="upload" id="tab-firma-upload">Subir imagen</div>
                <div class="signature-tab" data-tab="draw" id="tab-firma-draw">Dibujar firma</div>
              </div>

              <!-- OPCIÓN 1: SUBIR -->
              <div id="firma-upload-container">
                <div class="file-upload-area" id="firma-upload-area">
                  <input type="file" id="f-firma" accept="image/*" />
                  <div class="file-upload-icon"><i class="fa fa-signature"></i></div>
                  <div class="file-upload-text"><strong>Haz clic o arrastra</strong> una imagen de tu firma</div>
                  <div class="text-muted text-sm" style="margin-top:4px;">PNG, JPG – máx. 2MB</div>
                </div>
              </div>

              <!-- OPCIÓN 2: DIBUJAR -->
              <div id="firma-draw-container" class="hidden">
                <div class="signature-pad-container">
                  <canvas id="firma-canvas" class="signature-pad-canvas"></canvas>
                  <div class="signature-pad-actions">
                    <button type="button" class="btn-clear" id="btn-clear-canvas" title="Limpiar dibujo">
                      <i class="fa fa-eraser"></i>
                    </button>
                  </div>
                </div>
                <p class="text-muted text-sm" style="margin-top:8px;">Repunta el trazo con fluidez para una firma clara.</p>
              </div>

              <img id="firma-preview" class="file-preview" style="display:none;" alt="Vista previa firma" />
            </div>
          </div>

          <!-- Acciones -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" id="btn-guardar-borrador">
              <i class="fa fa-floppy-disk"></i> Guardar borrador
            </button>
            <button type="submit" class="btn-primary accent" id="btn-enviar">
              <i class="fa fa-paper-plane"></i> Enviar solicitud
            </button>
          </div>
        </form>
      </div>
    `;
  },

  init() {
    this._firmaSolicitanteData = null;
    this._gastoId = 0;
    this._addGastoRow(); // iniciar con una fila

    // Botón agregar ítem
    document.getElementById('add-gasto-btn')?.addEventListener('click', () => this._addGastoRow());

    // TABS DE FIRMA
    const tabUpload = document.getElementById('tab-firma-upload');
    const tabDraw = document.getElementById('tab-firma-draw');
    const contUpload = document.getElementById('firma-upload-container');
    const contDraw = document.getElementById('firma-draw-container');

    tabUpload?.addEventListener('click', () => {
      tabUpload.classList.add('active');
      tabDraw.classList.remove('active');
      contUpload.classList.remove('hidden');
      contDraw.classList.add('hidden');
    });

    tabDraw?.addEventListener('click', () => {
      tabDraw.classList.add('active');
      tabUpload.classList.remove('active');
      contDraw.classList.remove('hidden');
      contUpload.classList.add('hidden');
      this._initCanvas();
    });

    // Firma (Upload)
    const firmaInput = document.getElementById('f-firma');
    firmaInput?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { App.toast('La imagen es mayor a 2MB', 'error'); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        this._firmaSolicitanteData = ev.target.result;
        const prev = document.getElementById('firma-preview');
        prev.src = ev.target.result;
        prev.style.display = 'block';
        document.getElementById('firma-upload-area').classList.add('has-file');
      };
      reader.readAsDataURL(file);
    });

    // Drag and drop para firma
    const Area = document.getElementById('firma-upload-area');
    Area?.addEventListener('dragover', e => { e.preventDefault(); Area.style.borderColor = 'var(--accent-dark)'; });
    Area?.addEventListener('dragleave', () => { Area.style.borderColor = ''; });
    Area?.addEventListener('drop', e => {
      e.preventDefault(); Area.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) {
        if (firmaInput) {
          const dt = new DataTransfer();
          dt.items.add(file);
          firmaInput.files = dt.files;
          firmaInput.dispatchEvent(new Event('change'));
        }
      }
    });

    // Drawing Canvas Clear
    document.getElementById('btn-clear-canvas')?.addEventListener('click', () => this._clearCanvas());

    // Guardar borrador
    document.getElementById('btn-guardar-borrador')?.addEventListener('click', () => this._submit('Borrador'));

    // Enviar
    document.getElementById('form-anticipo')?.addEventListener('submit', e => { e.preventDefault(); this._submit('Enviado'); });
  },

  _initCanvas() {
    const canvas = document.getElementById('firma-canvas');
    if (!canvas || canvas.dataset.initialized) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    // Ajustar resolución
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return [clientX - rect.left, clientY - rect.top];
    };

    const startDrawing = (e) => {
      drawing = true;
      [lastX, lastY] = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      e.preventDefault();
    };

    const draw = (e) => {
      if (!drawing) return;
      const [x, y] = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      [lastX, lastY] = [x, y];
      e.preventDefault();
    };

    const stopDrawing = () => {
      if (!drawing) return;
      drawing = false;
      this._saveCanvas();
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    canvas.dataset.initialized = "true";
  },

  _clearCanvas() {
    const canvas = document.getElementById('firma-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this._firmaSolicitanteData = null;
    document.getElementById('firma-preview').style.display = 'none';
  },

  _saveCanvas() {
    const canvas = document.getElementById('firma-canvas');
    if (!canvas) return;
    // Verificar si el canvas está vacío (opcional, pero mejor siempre guardar el dataURL)
    const dataURL = canvas.toDataURL('image/png');
    this._firmaSolicitanteData = dataURL;
    const prev = document.getElementById('firma-preview');
    if (prev) {
      prev.src = dataURL;
      prev.style.display = 'block';
    }
  },

  _addGastoRow() {
    const id = ++this._gastoId;
    const tiposGasto = ['Viáticos', 'Transporte', 'Materiales', 'Alimentación', 'Hospedaje', 'Servicios', 'Comunicaciones', 'Otros'];
    const row = document.createElement('tr');
    row.id = `gasto-row-${id}`;
    row.innerHTML = `
      <td>
        <select class="gasto-tipo">
          ${tiposGasto.map(t => `<option>${t}</option>`).join('')}
        </select>
      </td>
      <td><input type="text" class="gasto-codigo" placeholder="Ej: V-001" /></td>
      <td><input type="text" class="gasto-desc" placeholder="Descripción del gasto..." /></td>
      <td><input type="number" class="gasto-valor" placeholder="0" min="0" step="1000" oninput="Form._recalcular()" /></td>
      <td><button type="button" class="del-row" onclick="Form._removeRow(${id})" title="Eliminar"><i class="fa fa-trash"></i></button></td>
    `;
    document.getElementById('gastos-body')?.appendChild(row);
    this._recalcular();
  },

  _removeRow(id) {
    document.getElementById(`gasto-row-${id}`)?.remove();
    this._recalcular();
  },

  _recalcular() {
    const valores = [...document.querySelectorAll('.gasto-valor')].map(i => parseFloat(i.value) || 0);
    const total = valores.reduce((a, b) => a + b, 0);
    const display = document.getElementById('total-display');
    const letras = document.getElementById('total-letras');
    if (display) display.textContent = `$ ${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
    if (letras) letras.textContent = this._numToLetras(total);
  },

  _getGastos() {
    return [...document.querySelectorAll('#gastos-body tr')].map(row => ({
      tipoGasto: row.querySelector('.gasto-tipo')?.value || '',
      codigo: row.querySelector('.gasto-codigo')?.value || '',
      descripcion: row.querySelector('.gasto-desc')?.value || '',
      valor: parseFloat(row.querySelector('.gasto-valor')?.value) || 0,
    }));
  },

  _validate(estado) {
    const getEl = (id) => document.getElementById(id);
    let ok = true;

    // Limpiar errores previos
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));

    if (estado === 'Enviado') {
      const requiredFields = {
        'f-num-doc': 'Número de documento',
        'f-contacto': 'Número de contacto',
        'f-proyecto': 'Proyecto / Programa',
        'f-concepto': 'Por concepto de',
        'f-banco': 'Entidad bancaria',
        'f-num-cuenta': 'Número de cuenta',
        'f-observaciones': 'Observaciones',
        'f-fecha-ejecucion': 'Fecha de ejecución',
      };

      for (const [id, label] of Object.entries(requiredFields)) {
        const el = getEl(id);
        if (!el || !el.value || !el.value.trim()) {
          if (el) el.classList.add('error');
          App.toast(`Campo requerido: ${label}`, 'error');
          ok = false;
        }
      }

      const gastos = this._getGastos();
      const hasValidGasto = gastos.some(item => (parseFloat(item.valor) || 0) > 0);
      if (gastos.length === 0 || !hasValidGasto) {
        App.toast('Agrega al menos un ítem de gasto con valor.', 'error');
        ok = false;
      }
    }
    return ok;
  },

  _submit(estado) {
    try {
      const session = Auth.getSession();
      if (!session) {
        App.toast('Sesión no encontrada. Por favor inicia sesión nuevamente.', 'error');
        return;
      }

      if (!this._validate(estado)) return;

      const gastos = this._getGastos();
      const total = gastos.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);

      const data = {
        fecha: document.getElementById('f-fecha')?.value || new Date().toLocaleDateString('es-CO'),
        nombre: document.getElementById('f-nombre')?.value || session.nombre,
        tipoDocumento: document.getElementById('f-tipo-doc')?.value || 'CC',
        numeroDocumento: document.getElementById('f-num-doc')?.value || '',
        cargo: document.getElementById('f-cargo')?.value || '',
        proyecto: document.getElementById('f-proyecto')?.value || '',
        correo: session.email,
        contacto: document.getElementById('f-contacto')?.value || '',
        porConceptoDe: document.getElementById('f-concepto')?.value || '',
        gastos,
        totalValor: total,
        totalEnLetras: this._numToLetras(total),
        entidad: document.getElementById('f-banco')?.value || '',
        tipoCuenta: document.getElementById('f-tipo-cuenta')?.value || 'Ahorros',
        numeroCuenta: document.getElementById('f-num-cuenta')?.value || '',
        observaciones: document.getElementById('f-observaciones')?.value || '',
        fechaEjecucion: document.getElementById('f-fecha-ejecucion')?.value || '',
        firmaSolicitante: this._firmaSolicitanteData,
      };

      const anticipo = DB.create(data);
      if (estado === 'Enviado') {
        DB.cambiarEstado(anticipo.id, 'Enviado', session.nombre);
        App.toast(`✅ Solicitud ${anticipo.id} enviada correctamente`, 'success');
      } else {
        App.toast(`💾 Borrador ${anticipo.id} guardado`, 'info');
      }

      // Navegar al detalle del nuevo anticipo
      App.navegarA('detalle', anticipo.id);

    } catch (err) {
      console.error('Error en _submit:', err);
      App.toast('Error al procesar la solicitud. Revisa la consola.', 'error');
    }
  },

  // ── Conversión de número a texto en español ────────────
  _numToLetras(n) {
    if (!n || n === 0) return 'Cero pesos';
    const entero = Math.floor(n);
    const texto = this._convertirEntero(entero);
    return `${texto.charAt(0).toUpperCase() + texto.slice(1)} pesos (M/CTE)`;
  },

  _convertirEntero(n) {
    if (n === 0) return 'cero';
    if (n < 0) return 'menos ' + this._convertirEntero(-n);

    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
      'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
      'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (n < 30) return unidades[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return u === 0 ? decenas[d] : decenas[d] + ' y ' + unidades[u];
    }
    if (n === 100) return 'cien';
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      return (c === 1 ? 'ciento' : centenas[c]) + (r > 0 ? ' ' + this._convertirEntero(r) : '');
    }
    if (n === 1000) return 'mil';
    if (n < 1000000) {
      const miles = Math.floor(n / 1000);
      const r = n % 1000;
      const prefMil = miles === 1 ? 'mil' : this._convertirEntero(miles) + ' mil';
      return prefMil + (r > 0 ? ' ' + this._convertirEntero(r) : '');
    }
    if (n < 1000000000) {
      const mill = Math.floor(n / 1000000);
      const r = n % 1000000;
      const prefMill = mill === 1 ? 'un millón' : this._convertirEntero(mill) + ' millones';
      return prefMill + (r > 0 ? ' ' + this._convertirEntero(r) : '');
    }
    return n.toLocaleString('es-CO');
  }
};
