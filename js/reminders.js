/**
 * REMINDERS.JS — Lógica de recordatorios y alertas
 */

const Reminders = {
    /**
     * Calcula el nivel de alerta para un anticipo según días desde fecha de ejecución.
     * Retorna: { nivel: 'none'|'blue'|'red'|'escalado', dias: number, mensaje: string }
     */
    calcularAlerta(anticipo) {
        if (anticipo.estado !== 'Anticipo abierto') return { nivel: 'none', dias: 0, mensaje: '' };
        if (!anticipo.fechaEjecucion) return { nivel: 'none', dias: 0, mensaje: '' };

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const fe = new Date(anticipo.fechaEjecucion + 'T00:00:00'); fe.setHours(0, 0, 0, 0);
        const dias = Math.floor((hoy - fe) / 86400000);

        if (dias <= 0) return { nivel: 'none', dias, mensaje: '' };
        if (dias <= 2) return { nivel: 'blue', dias, mensaje: `${dias}d desde fecha de ejecución` };
        if (dias < 10) return { nivel: 'red', dias, mensaje: `⚠️ ${dias}d vencido` };
        return { nivel: 'escalado', dias, mensaje: `🚨 ${dias}d vencido – Escalar a jefe` };
    },

    /**
     * Genera la lista de notificaciones activas para mostrar en el panel.
     */
    getNotificaciones() {
        const anticipos = DB.getAll();
        const notifs = [];

        anticipos.forEach(a => {
            const alerta = this.calcularAlerta(a);
            if (alerta.nivel === 'none') return;

            if (alerta.nivel === 'blue') {
                notifs.push({
                    tipo: 'blue',
                    icono: 'fa-info-circle',
                    titulo: `${a.id} – ${a.solicitante.nombre}`,
                    texto: `Anticipo abierto. ${alerta.mensaje}`,
                    id: a.id
                });
            } else if (alerta.nivel === 'red') {
                notifs.push({
                    tipo: 'red',
                    icono: 'fa-exclamation-triangle',
                    titulo: `${a.id} – ${a.solicitante.nombre}`,
                    texto: `Anticipo vencido. ${alerta.mensaje}`,
                    id: a.id
                });
            } else if (alerta.nivel === 'escalado') {
                notifs.push({
                    tipo: 'red',
                    icono: 'fa-fire',
                    titulo: `${a.id} – ESCALAR`,
                    texto: `${alerta.mensaje} – ${a.solicitante.nombre}`,
                    id: a.id
                });
            }
        });

        // Anticipos pendientes de aprobación
        const pendientes = DB.getPendientesAprobacion();
        if (pendientes.length > 0 && Auth.can('aprobar')) {
            notifs.unshift({
                tipo: 'yellow',
                icono: 'fa-clock',
                titulo: 'Solicitudes pendientes',
                texto: `${pendientes.length} anticipo(s) esperan aprobación`,
                id: null
            });
        }

        return notifs;
    },

    /**
     * Actualiza el punto de notificación y los badges del sidebar.
     */
    actualizarUI() {
        const notifs = this.getNotificaciones();
        const dot = document.getElementById('notif-dot');
        if (dot) {
            dot.classList.toggle('hidden', notifs.length === 0);
        }

        // Badge de aprobaciones en sidebar
        const badgeApr = document.getElementById('badge-aprobaciones');
        const pendientes = DB.getPendientesAprobacion().length;
        if (badgeApr) {
            if (pendientes > 0 && Auth.can('aprobar')) {
                badgeApr.style.display = 'flex';
                badgeApr.textContent = pendientes;
            } else {
                badgeApr.style.display = 'none';
            }
        }

        // Badge en mis anticipos – vencidos personales
        const session = Auth.getSession();
        const badgeMis = document.getElementById('badge-mis-anticipos');
        if (badgeMis && session) {
            const misAbiertos = DB.getAbiertos(session.email);
            const misVencidos = misAbiertos.filter(a => {
                const alerta = this.calcularAlerta(a);
                return alerta.nivel === 'red' || alerta.nivel === 'escalado';
            });
            if (misVencidos.length > 0) {
                badgeMis.style.display = 'flex';
                badgeMis.textContent = misVencidos.length;
            } else {
                badgeMis.style.display = 'none';
            }
        }
    },

    /**
     * Renderiza el panel de notificaciones.
     */
    renderPanel() {
        const panel = document.getElementById('notif-panel');
        if (!panel) return;
        const notifs = this.getNotificaciones();

        if (notifs.length === 0) {
            panel.innerHTML = `
        <div class="notif-header">Notificaciones</div>
        <div class="notif-empty"><i class="fa fa-check-circle" style="font-size:32px;opacity:.3;display:block;margin-bottom:8px;"></i>Sin alertas pendientes</div>
      `;
            return;
        }

        const items = notifs.map(n => `
      <div class="notif-item" ${n.id ? `onclick="App.navegarA('detalle','${n.id}'); document.getElementById('notif-panel').classList.add('hidden');"` : ''} style="${n.id ? 'cursor:pointer' : ''}">
        <div class="notif-icon ${n.tipo}"><i class="fa ${n.icono}"></i></div>
        <div>
          <div class="notif-text"><strong>${n.titulo}</strong><br>${n.texto}</div>
          <div class="notif-time">Ahora mismo</div>
        </div>
      </div>
    `).join('');

        panel.innerHTML = `<div class="notif-header">Notificaciones (${notifs.length})</div>${items}`;
    },

    /**
     * Retorna el HTML del badge de alerta para una fila de tabla.
     */
    badgeHTML(anticipo) {
        const alerta = this.calcularAlerta(anticipo);
        if (alerta.nivel === 'none') return '';
        const cls = alerta.nivel === 'blue' ? 'alert-blue' : 'alert-red';
        return `<span class="alert-badge ${cls}"><i class="fa fa-bell"></i> ${alerta.mensaje}</span>`;
    }
};
