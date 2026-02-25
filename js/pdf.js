/**
 * PDF.JS — Generación de PDF institucional con jsPDF
 */

const PDF = {
    /**
     * Genera el PDF formal de solicitud de anticipo.
     * @param {Object} anticipo - Objeto completo del anticipo
     */
    generar(anticipo) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'letter');
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 18;
        const contentW = pageW - margin * 2;
        let y = 0;

        // ── Helpers ────────────────────────────────────────
        const addPage = () => {
            doc.addPage();
            y = 18;
            this._drawFooter(doc, pageW, pageH, margin, anticipo.id);
        };
        const checkPage = (needed = 10) => { if (y + needed > pageH - 20) addPage(); };

        // ── Cabecera ───────────────────────────────────────
        // Fondo verde oscuro en el header
        doc.setFillColor(19, 45, 30);
        doc.rect(0, 0, pageW, 38, 'F');

        // Logo (SVG-like rectangle)
        doc.setFillColor(181, 226, 77);
        doc.roundedRect(margin, 8, 22, 22, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(19, 45, 30);
        doc.text('FUND', margin + 11, 17, { align: 'center' });
        doc.text('AEC', margin + 11, 23, { align: 'center' });

        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text('SOLICITUD DE ANTICIPO', margin + 27, 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(181, 226, 77);
        doc.text('FUNDAEC – Fundación para la Aplicación y Enseñanza de las Ciencias', margin + 27, 22);

        // Número de anticipo y estado
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(anticipo.id, pageW - margin, 15, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(181, 226, 77);
        doc.text(`Estado: ${anticipo.estado}`, pageW - margin, 22, { align: 'right' });
        doc.text(`Fecha: ${anticipo.fecha}`, pageW - margin, 28, { align: 'right' });

        y = 46;
        this._drawFooter(doc, pageW, pageH, margin, anticipo.id);

        // ── Sección 2: Datos del solicitante ───────────────
        y = this._sectionHeader(doc, y, margin, contentW, '1', 'INFORMACIÓN DEL SOLICITANTE');
        const s = anticipo.solicitante;
        const datosS = [
            ['Nombre Completo', s.nombre],
            ['Tipo de Documento', s.tipoDocumento],
            ['Número de Documento', s.numeroDocumento],
            ['Cargo', s.cargo],
            ['Proyecto / Programa', s.proyecto],
            ['Correo Electrónico', s.correo],
            ['Número de Contacto', s.contacto],
        ];
        y = this._fieldGrid(doc, y, margin, contentW, datosS);

        // ── Sección 3: Información del anticipo ────────────
        checkPage(20);
        y = this._sectionHeader(doc, y + 4, margin, contentW, '2', 'INFORMACIÓN DEL ANTICIPO');

        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80, 100, 85);
        doc.text('Por concepto de:', margin, y);
        y += 4;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
        const concepto = doc.splitTextToSize(anticipo.porConceptoDe || '–', contentW);
        doc.text(concepto, margin, y);
        y += concepto.length * 5 + 4;

        // Tabla de gastos
        checkPage(20);
        const gastoRows = (anticipo.gastos || []).map(g => [
            g.tipoGasto || '–', g.codigo || '–', g.descripcion || '–',
            `$ ${this._formatNum(g.valor)}`
        ]);
        if (gastoRows.length === 0) gastoRows.push(['–', '–', '–', '$ 0']);

        doc.autoTable({
            startY: y,
            head: [['Tipo de Gasto', 'Código', 'Descripción', 'Valor']],
            body: gastoRows,
            foot: [['', '', 'TOTAL', `$ ${this._formatNum(anticipo.totalValor)}`]],
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [19, 45, 30], textColor: [181, 226, 77], fontStyle: 'bold', fontSize: 8 },
            footStyles: { fillColor: [240, 244, 238], textColor: [20, 20, 20], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8, textColor: [40, 60, 45] },
            alternateRowStyles: { fillColor: [248, 250, 246] },
            columnStyles: { 3: { halign: 'right' } },
        });
        y = doc.lastAutoTable.finalY + 4;

        // Total en letras
        doc.setFillColor(240, 244, 238);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(80, 100, 85);
        const letras = doc.splitTextToSize(`Son: ${anticipo.totalEnLetras || '–'}`, contentW - 6);
        doc.text(letras, margin + 3, y + 6.5);
        y += 14;

        // ── Sección 4: Información bancaria ───────────────
        checkPage(30);
        y = this._sectionHeader(doc, y, margin, contentW, '3', 'INFORMACIÓN PARA EL PAGO');
        const b = anticipo.banco || {};
        const datosB = [
            ['Entidad Bancaria', b.entidad || '–'],
            ['Tipo de Cuenta', b.tipoCuenta || '–'],
            ['Número de Cuenta', b.numeroCuenta || '–'],
        ];
        y = this._fieldGrid(doc, y, margin, contentW, datosB);

        // ── Sección 5: Observaciones ───────────────────────
        checkPage(30);
        y = this._sectionHeader(doc, y + 4, margin, contentW, '4', 'OBSERVACIONES');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80, 100, 85);
        doc.text('Observaciones:', margin, y);
        y += 4;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
        const obs = doc.splitTextToSize(anticipo.observaciones || '–', contentW);
        doc.text(obs, margin, y);
        y += obs.length * 5 + 4;

        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80, 100, 85);
        doc.text('Fecha estimada de ejecución del gasto:', margin, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
        doc.text(anticipo.fechaEjecucion ? this._formatDate(anticipo.fechaEjecucion) : '–', margin + 75, y);
        y += 8;

        // ── Sección 6: Firmas ──────────────────────────────
        checkPage(55);
        y = this._sectionHeader(doc, y, margin, contentW, '5', 'FIRMAS');

        const firmaW = (contentW - 12) / 2;
        const firmaH = 35;
        const firmaY = y + 2;

        // Caja firma solicitante
        doc.setDrawColor(200, 220, 200);
        doc.setFillColor(248, 252, 246);
        doc.roundedRect(margin, firmaY, firmaW, firmaH, 2, 2, 'FD');

        if (anticipo.firmasSolicitante) {
            try {
                doc.addImage(anticipo.firmasSolicitante, 'PNG', margin + 4, firmaY + 4, firmaW - 8, firmaH - 14);
            } catch (e) { /* Si no puede cargar la imagen, omitir */ }
        }
        doc.setDrawColor(181, 226, 77);
        doc.line(margin + 6, firmaY + firmaH - 8, margin + firmaW - 6, firmaY + firmaH - 8);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(80, 100, 85);
        doc.text('Firma del Solicitante', margin + firmaW / 2, firmaY + firmaH - 4, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
        doc.text(s.nombre || '–', margin + firmaW / 2, firmaY + firmaH - 1, { align: 'center' });

        // Caja firma aprobador
        const firma2X = margin + firmaW + 12;
        doc.setDrawColor(200, 220, 200);
        doc.setFillColor(248, 252, 246);
        doc.roundedRect(firma2X, firmaY, firmaW, firmaH, 2, 2, 'FD');

        if (anticipo.firmaAprobador) {
            try {
                doc.addImage(anticipo.firmaAprobador, 'PNG', firma2X + 4, firmaY + 4, firmaW - 8, firmaH - 14);
            } catch (e) { /* omitir */ }
        } else {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(160, 180, 160);
            doc.text('Pendiente de aprobación', firma2X + firmaW / 2, firmaY + firmaH / 2, { align: 'center' });
        }
        doc.setDrawColor(181, 226, 77);
        doc.line(firma2X + 6, firmaY + firmaH - 8, firma2X + firmaW - 6, firmaY + firmaH - 8);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(80, 100, 85);
        doc.text('Firma del Aprobador', firma2X + firmaW / 2, firmaY + firmaH - 4, { align: 'center' });

        y = firmaY + firmaH + 6;

        // ── Guardar ────────────────────────────────────────
        doc.save(`${anticipo.id}_Solicitud_Anticipo.pdf`);
        return true;
    },

    _drawFooter(doc, pageW, pageH, margin, id) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(150, 170, 155);
        doc.setDrawColor(210, 230, 210);
        doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
        doc.text('FUNDAEC – Gestión de Anticipos Financieros', margin, pageH - 9);
        doc.text(`Generado: ${new Date().toLocaleString('es-CO')}  |  ${id}`, pageW - margin, pageH - 9, { align: 'right' });
    },

    _sectionHeader(doc, y, margin, contentW, num, titulo) {
        doc.setFillColor(19, 45, 30);
        doc.roundedRect(margin, y, contentW, 9, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(181, 226, 77);
        doc.text(`${num}. ${titulo}`, margin + 4, y + 6);
        return y + 13;
    },

    _fieldGrid(doc, y, margin, contentW, campos) {
        const colW = contentW / 2;
        campos.forEach((campo, i) => {
            const col = i % 2;
            const x = margin + col * (colW + 2);
            if (col === 0 && i > 0) y += 8;

            doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(90, 110, 95);
            doc.text(campo[0] + ':', x, y);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(15, 25, 18);
            const val = doc.splitTextToSize(campo[1] || '–', colW - 4);
            doc.text(val, x, y + 4.5);
        });
        y += 12;
        return y;
    },

    _formatNum(n) {
        const num = parseFloat(n) || 0;
        return num.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    },

    _formatDate(d) {
        if (!d) return '–';
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    },
};
