/**
 * LEGALIZATION.JS — Módulo de Cierre y Legalización de Anticipos
 */

const Legalization = {
    selectedId: null,
    files: [],

    render() {
        const session = Auth.getSession();
        const todos = Auth.can('ver_todos') ? DB.getAll() : DB.getByEmail(session.email);

        // Filtrar anticipos que se pueden legalizar: Anticipo abierto o Vencido
        // También mostrar los que ya están 'Legalizados' (pendientes de cierre) para el aprobador
        const pendientesLegalizar = todos.filter(a => ['Anticipo abierto', 'Vencido'].includes(a.estado));
        const pendientesCierre = todos.filter(a => a.estado === 'Legalización enviada');

        let html = `
      <div class="legalization-container">
        <div class="card mb-4">
          <div class="card-header">
            <div>
              <div class="card-title">Legalización de Anticipos</div>
              <div class="card-subtitle">Carga de soportes y cierre de solicitudes</div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-clock-rotate-left"></i> Pendientes por Legalizar</div>
            </div>
            <div class="card-body">
              ${this._renderList(pendientesLegalizar, 'legalizar')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa fa-check-double"></i> Pendientes de Revisión y Cierre</div>
            </div>
            <div class="card-body">
              ${this._renderList(pendientesCierre, 'revisar')}
            </div>
          </div>
        </div>
      </div>
    `;
        return html;
    },

    _renderList(lista, accion) {
        if (lista.length === 0) {
            return `<div class="empty-state-sm">No hay anticipos en este estado</div>`;
        }

        const formatMoney = n => `$ ${(parseFloat(n) || 0).toLocaleString('es-CO')}`;

        return `
      <div class="leg-list">
        ${lista.map(a => `
          <div class="leg-list-item">
            <div class="leg-info">
              <div class="leg-id">${a.id}</div>
              <div class="leg-name">${a.solicitante.nombre}</div>
              <div class="leg-concept">${a.porConceptoDe || 'Sin concepto'}</div>
              <div class="leg-amount">${formatMoney(a.totalValor)}</div>
            </div>
            <div class="leg-actions">
              ${accion === 'legalizar'
                ? `<button class="btn-primary btn-sm" onclick="Legalization.abrirFormulario('${a.id}')"><i class="fa fa-file-upload"></i> Legalizar</button>`
                : `<button class="btn-secondary btn-sm" onclick="App.navegarA('detalle', '${a.id}')"><i class="fa fa-eye"></i> Revisar</button>`
            }
            </div>
          </div>
        `).join('')}
      </div>
    `;
    },

    abrirFormulario(id) {
        this.selectedId = id;
        this.files = [];
        const a = DB.getById(id);

        document.getElementById('modal-content').innerHTML = `
      <div class="modal-title">Legalización de Anticipo — ${id}</div>
      <div class="modal-body">
        <p class="text-muted mb-4">Cargue los soportes de gastos (Facturas, recibos, etc.) en formato PDF, Imagen o Excel.</p>
        
        <div class="legal-summary mb-4">
          <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <span class="font-600">Total a legalizar:</span>
            <span class="font-600 text-blue">$ ${parseFloat(a.totalValor).toLocaleString('es-CO')}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="leg-progress" style="width: 0%"></div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Carga de archivos (PDF, JPG, PNG, XLSX)</label>
          <div class="file-drop-zone" id="leg-drop-zone">
            <input type="file" id="leg-file-input" multiple accept=".pdf,image/*,.xlsx,.xls" style="display:none" />
            <div class="drop-zone-content" onclick="document.getElementById('leg-file-input').click()">
              <i class="fa fa-cloud-arrow-up"></i>
              <p>Arrastre archivos aquí o haga clic para seleccionar</p>
              <span>Máximo 5MB por archivo</span>
            </div>
          </div>
        </div>

        <div class="file-list" id="leg-file-list">
          <!-- Aquí se listarán los archivos cargados -->
        </div>

        <div class="form-group mt-4">
          <label class="form-label">Comentarios / Observaciones de la legalización</label>
          <textarea class="form-control" id="leg-comments" rows="3" placeholder="Describa brevemente los gastos legalizados..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="App.cerrarModal()">Cancelar</button>
        <button class="btn-primary" id="btn-submit-legalization" onclick="Legalization.enviar()">
          <i class="fa fa-paper-plane"></i> Enviar Legalización
        </button>
      </div>
    `;

        this._initDropZone();
        App.abrirModal();
    },

    _initDropZone() {
        const zone = document.getElementById('leg-drop-zone');
        const input = document.getElementById('leg-file-input');

        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('active'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('active'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('active');
            this._handleFiles(e.dataTransfer.files);
        });

        input.addEventListener('change', (e) => {
            this._handleFiles(e.target.files);
        });
    },

    _handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                App.toast(`El archivo ${file.name} supera los 5MB`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    id: Date.now() + Math.random().toString(36).substr(2, 9)
                };
                this.files.push(fileData);
                this._renderFileList();
            };
            reader.readAsDataURL(file);
        });
    },

    _renderFileList() {
        const listCont = document.getElementById('leg-file-list');
        if (!listCont) return;

        if (this.files.length === 0) {
            listCont.innerHTML = '';
            return;
        }

        listCont.innerHTML = this.files.map(f => `
      <div class="file-item" id="f-${f.id}">
        <div class="file-icon">
          <i class="fa ${this._getFileIcon(f.name)}"></i>
        </div>
        <div class="file-info">
          <div class="file-name">${f.name}</div>
          <div class="file-meta">${(f.size / 1024).toFixed(1)} KB</div>
        </div>
        <button class="file-remove" onclick="Legalization.removerArchivo('${f.id}')">
          <i class="fa fa-times"></i>
        </button>
      </div>
    `).join('');

        // Actualizar progreso (simulado)
        const progress = Math.min((this.files.length / 3) * 100, 100);
        const bar = document.getElementById('leg-progress');
        if (bar) bar.style.width = progress + '%';
    },

    _getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'fa-file-image';
        if (ext === 'pdf') return 'fa-file-pdf';
        if (['xlsx', 'xls', 'csv'].includes(ext)) return 'fa-file-excel';
        return 'fa-file';
    },

    removerArchivo(id) {
        this.files = this.files.filter(f => f.id !== id);
        this._renderFileList();
    },

    enviar() {
        if (this.files.length === 0) {
            App.toast('Debe cargar al menos un archivo de soporte', 'warning');
            return;
        }

        const btn = document.getElementById('btn-submit-legalization');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enviando...';

        const comments = document.getElementById('leg-comments').value;
        const session = Auth.getSession();

        setTimeout(() => {
            const a = DB.getById(this.selectedId);

            // Guardar legalización en el objeto del anticipo
            const legalizacion = {
                fechaEnvio: new Date().toISOString(),
                usuario: session.nombre,
                comentarios: comments,
                archivos: this.files.map(f => ({ name: f.name, type: f.type, data: f.data }))
            };

            DB.update(this.selectedId, {
                legalizacion: legalizacion,
                estado: 'Legalización enviada'
            });

            DB.addHistorial(this.selectedId, 'Legalización enviada con soportes', session.nombre, 'Legalización enviada');

            App.cerrarModal();
            App.toast('Legalización enviada correctamente ✅', 'success');
            App.navegarA('legalizaciones');
            Reminders.actualizarUI();
        }, 1500);
    }
};
