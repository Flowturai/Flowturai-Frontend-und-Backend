const PDFDocument = require('pdfkit');

/**
 * Generiert eine professionelle Einnahmen-Überschuss-Rechnung (EÜR) als PDF.
 * Geeignet für Kleingewerbe nach §19 UStG.
 *
 * @param {{ year: number, invoices: object[], expenses: object[] }} param0
 * @returns {Promise<Buffer>}
 */
function generateEURPDF({ year, invoices, expenses }) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data', c  => chunks.push(c));
    doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', e  => reject(e));

    // ── Design-Tokens ────────────────────────────────────────
    const W      = 595.28;
    const M      = 48;
    const DARK   = '#0D2137';
    const ACCENT = '#00C896';
    const CYAN   = '#00A8E8';
    const RED    = '#e53935';
    const GRAY   = '#6b7280';
    const LIGHT  = '#F5F7FA';
    const BDR    = '#dde3ec';
    const TEXT   = '#1C1C1E';
    const TW     = W - M * 2;   // Tabellen-Breite

    // ── Berechnungen ──────────────────────────────────────────
    const paidInvoices = invoices.filter(i => i.status === 'paid' && !i.is_cancellation);
    const totalIncome  = paidInvoices.reduce((s, i) => s + parseFloat(i.amount), 0);

    const catOrder = ['software_tools','fahrtkosten','buero_material','marketing_website','sonstiges'];
    const catLabels = {
      software_tools:   'Software & Tools',
      fahrtkosten:      'Fahrtkosten',
      buero_material:   'Büro & Material',
      marketing_website:'Marketing & Website',
      sonstiges:        'Sonstiges',
    };
    const expensesByCategory = {};
    catOrder.forEach(c => { expensesByCategory[c] = 0; });
    expenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + parseFloat(e.amount);
    });
    const totalExpenses = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
    const profit        = totalIncome - totalExpenses;

    // ── Hilfsfunktionen ───────────────────────────────────────
    const fmt  = n => `${parseFloat(n || 0).toFixed(2).replace('.', ',')} €`;
    const fmtD = d => d ? new Date(d).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
    let y = 0;  // aktueller y-Cursor

    // ── Neue Seite beginnen ───────────────────────────────────
    function newPage() {
      doc.addPage({ margin: 0, size: 'A4' });
      // Mini-Header auf Folgeseiten
      doc.rect(0, 0, W, 36).fill(DARK);
      doc.rect(0, 33, W, 3).fill(ACCENT);
      doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(10)
         .text('Flowturai', M, 13)
         .text(`EÜR ${year}`, W / 2, 13, { width: W / 2 - M, align: 'right' });
      // Seitenzahl
      doc.fillColor('#4b5a6b').font('Helvetica').fontSize(8)
         .text(`Seite ${doc.bufferedPageRange().count + 1}`, W - M - 40, 15, { width: 40, align: 'right' });
      y = 52;
    }

    // ── Check ob neue Seite nötig ─────────────────────────────
    function checkPage(needed = 24) {
      if (y + needed > 755) newPage();
    }

    // ── Tabellenspalten ───────────────────────────────────────
    function tableHeader(cols) {
      doc.rect(M, y, TW, 22).fill(DARK);
      doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(8.5);
      cols.forEach(({ label, x, w, align }) =>
        doc.text(label, M + x + 6, y + 7, { width: w - 12, align: align || 'left' })
      );
      y += 22;
    }

    function tableRow(cols, data, even, color) {
      const rowH = 20;
      doc.rect(M, y, TW, rowH).fill(even ? '#ffffff' : LIGHT).stroke(BDR);
      (color ? doc.fillColor(color) : doc.fillColor(TEXT)).font('Helvetica').fontSize(9);
      cols.forEach(({ key, x, w, align }) => {
        const val = typeof key === 'function' ? key(data) : (data[key] || '—');
        doc.text(String(val), M + x + 6, y + 6, { width: w - 12, align: align || 'left', lineBreak: false });
      });
      y += rowH;
    }

    function sectionTitle(title, icon) {
      checkPage(36);
      y += 12;
      doc.rect(M, y, TW, 28).fill(DARK);
      doc.rect(M + TW - 3, y, 3, 28).fill(ACCENT);
      doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(12)
         .text(`${icon}  ${title}`, M + 12, y + 8);
      y += 28;
    }

    function sumRow(label, amount, highlight = false) {
      checkPage(26);
      if (highlight) {
        doc.rect(M, y, TW, 26).fill(highlight === 'red' ? '#fff0f0' : (highlight === 'green' ? '#f0fdf8' : ACCENT));
        doc.rect(M, y, 4, 26).fill(highlight === 'red' ? RED : (highlight === 'green' ? ACCENT : DARK));
        doc.fillColor(highlight === 'accent' ? DARK : TEXT).font('Helvetica-Bold').fontSize(11)
           .text(label, M + 14, y + 8)
           .text(fmt(amount), M + TW - 90, y + 8, { width: 84, align: 'right' });
      } else {
        doc.rect(M, y, TW, 22).fill(LIGHT).stroke(BDR);
        doc.fillColor(GRAY).font('Helvetica').fontSize(9)
           .text(label, M + 14, y + 7);
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
           .text(fmt(amount), M + TW - 90, y + 7, { width: 84, align: 'right' });
      }
      y += highlight ? 26 : 22;
    }

    // ═══════════════════════════════════════════════════════════
    // SEITE 1 – DECKBLATT
    // ═══════════════════════════════════════════════════════════

    // Header-Balken
    doc.rect(0, 0, W, 100).fill(DARK);
    doc.rect(0, 97, W, 3).fill(ACCENT);
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(24).text('Flowturai', M, 28);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(10)
       .text('KI-Automatisierung für Ihren Betrieb', M, 58);
    doc.circle(W - M - 20, 50, 8).fill(ACCENT);
    doc.circle(W - M - 5,  50, 8).fill(CYAN);

    // Titel
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(28)
       .text('Einnahmen-Überschuss-', M, 126)
       .text('Rechnung (EÜR)', M, 158);
    doc.rect(M, 192, 120, 4).fill(ACCENT);
    doc.rect(M + 124, 192, 60, 4).fill(CYAN);

    // Meta-Box
    const metaY = 214;
    doc.rect(M, metaY, TW, 108).fill(LIGHT).stroke(BDR);
    doc.rect(M, metaY, 4, 108).fill(CYAN);

    const metaRows = [
      ['Steuerpflichtiger',    `Jeremy Jung`],
      ['Betrieb',              `Flowturai`],
      ['Adresse',              process.env.BUSINESS_ADDRESS || '—'],
      ['Wirtschaftsjahr',      `01.01.${year} – 31.12.${year}`],
      ['Erstellungsdatum',     new Date().toLocaleDateString('de-DE')],
    ];
    metaRows.forEach(([label, val], i) => {
      const ry = metaY + 12 + i * 18;
      doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(label, M + 16, ry);
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(val, M + 140, ry);
    });

    // Ergebnis-Zusammenfassung (Deckblatt)
    const summY = 340;
    const colW  = (TW - 8) / 3;

    [[totalIncome, 'EINNAHMEN', ACCENT], [totalExpenses, 'AUSGABEN', RED], [profit, 'GEWINN', profit >= 0 ? CYAN : RED]]
      .forEach(([val, label, color], i) => {
        const bx = M + i * (colW + 4);
        doc.rect(bx, summY, colW, 72).fill('#ffffff').stroke(BDR);
        doc.rect(bx, summY, colW, 4).fill(color);
        doc.fillColor(GRAY).font('Helvetica').fontSize(9)
           .text(label, bx + 10, summY + 16, { width: colW - 20, align: 'center' });
        doc.fillColor(color).font('Helvetica-Bold').fontSize(16)
           .text(fmt(val), bx + 10, summY + 34, { width: colW - 20, align: 'center' });
      });

    // §19 UStG Hinweis
    doc.rect(M, summY + 84, TW, 36).fill('#fffbeb').stroke('#fde68a');
    doc.rect(M, summY + 84, 4, 36).fill('#f59e0b');
    doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(9)
       .text('Hinweis:', M + 12, summY + 93);
    doc.font('Helvetica').text(
      'Gemäß §19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer erhoben.',
      M + 60, summY + 93, { width: TW - 72 }
    );

    // Monatsübersicht auf Deckblatt
    const monthGroups = {};
    for (let m = 1; m <= 12; m++) monthGroups[m] = { income: 0, expenses: 0 };

    paidInvoices.forEach(i => {
      const m = new Date(i.paid_at || i.created_at).getMonth() + 1;
      monthGroups[m].income += parseFloat(i.amount);
    });
    expenses.forEach(e => {
      const m = new Date(e.expense_date).getMonth() + 1;
      monthGroups[m].expenses += parseFloat(e.amount);
    });

    const monthNames = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const mTableY = summY + 136;

    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
       .text('Monatsübersicht', M, mTableY);
    doc.rect(M, mTableY + 16, 40, 3).fill(ACCENT);

    const mY = mTableY + 28;
    doc.rect(M, mY, TW, 20).fill(DARK);
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(8.5)
       .text('MONAT', M + 6,      mY + 6)
       .text('EINNAHMEN', M + 100, mY + 6, { width: 90, align: 'right' })
       .text('AUSGABEN',  M + 200, mY + 6, { width: 90, align: 'right' })
       .text('SALDO',     M + TW - 96, mY + 6, { width: 90, align: 'right' });

    monthNames.forEach((name, idx) => {
      const m   = idx + 1;
      const inc = monthGroups[m].income;
      const exp = monthGroups[m].expenses;
      const bal = inc - exp;
      const ry  = mY + 20 + idx * 17;

      doc.rect(M, ry, TW, 17).fill(idx % 2 === 0 ? '#ffffff' : LIGHT).stroke(BDR);
      doc.fillColor(TEXT).font('Helvetica').fontSize(8.5)
         .text(`${name} ${year}`, M + 6, ry + 5);
      doc.font(inc > 0 ? 'Helvetica-Bold' : 'Helvetica')
         .text(inc > 0 ? fmt(inc) : '—', M + 100, ry + 5, { width: 90, align: 'right' });
      doc.font(exp > 0 ? 'Helvetica-Bold' : 'Helvetica').fillColor(exp > 0 ? RED : GRAY)
         .text(exp > 0 ? fmt(exp) : '—', M + 200, ry + 5, { width: 90, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(bal >= 0 ? (bal > 0 ? ACCENT : GRAY) : RED)
         .text(inc > 0 || exp > 0 ? fmt(bal) : '—', M + TW - 96, ry + 5, { width: 90, align: 'right' });
    });

    // Jahres-Summenzeile der Monatsübersicht
    const msumY = mY + 20 + 12 * 17;
    doc.rect(M, msumY, TW, 22).fill(DARK);
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(9)
       .text('JAHRESSUMME', M + 6, msumY + 7)
       .text(fmt(totalIncome),   M + 100, msumY + 7, { width: 90, align: 'right' })
       .text(fmt(totalExpenses), M + 200, msumY + 7, { width: 90, align: 'right' });
    doc.fillColor(profit >= 0 ? ACCENT : RED)
       .text(fmt(profit), M + TW - 96, msumY + 7, { width: 90, align: 'right' });

    // Footer Seite 1
    doc.rect(0, 775, W, 67).fill(DARK);
    doc.rect(0, 775, W, 3).fill(ACCENT);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(8)
       .text(
         `Jeremy Jung · Flowturai · ${process.env.IONOS_EMAIL || ''} · ${process.env.BUSINESS_ADDRESS || ''}`,
         M, 796, { width: TW, align: 'center' }
       );
    doc.fillColor('#4b5a6b').fontSize(8)
       .text('Seite 1', W - M - 40, 818, { width: 40, align: 'right' });

    // ═══════════════════════════════════════════════════════════
    // SEITE 2+ – EINNAHMEN-DETAIL
    // ═══════════════════════════════════════════════════════════
    newPage();

    sectionTitle(`Abschnitt A – Betriebseinnahmen ${year}`, 'A.');

    const invCols = [
      { label: 'BELEGNR.',     key: 'invoice_number', x: 0,   w: 90 },
      { label: 'DATUM',        key: d => fmtD(d.paid_at || d.created_at), x: 90,  w: 72 },
      { label: 'RECHNUNGSNR.', key: 'invoice_number', x: 162, w: 85 },
      { label: 'KUNDE',        key: 'contact_name',   x: 247, w: 140 },
      { label: 'BETRAG',       key: d => fmt(d.amount), x: 387, w: 96, align: 'right' },
    ];
    // Korrekte Spalten für Tabelle (header + rows teilen dieselben cols)
    const invTableCols = [
      { label: 'BELEGNR.',     key: 'invoice_number', x: 0,   w: 90 },
      { label: 'DATUM',        key: d => fmtD(d.paid_at || d.created_at), x: 90,  w: 72 },
      { label: 'BESCHREIBUNG', key: d => (d.description||'').substring(0, 42), x: 162, w: 190 },
      { label: 'KUNDE',        key: 'contact_name',   x: 352, w: 100 },
      { label: 'BETRAG',       key: d => fmt(d.amount), x: 452, w: 31, align: 'right' },
    ];

    checkPage(22);
    tableHeader(invTableCols);

    if (paidInvoices.length === 0) {
      checkPage(22);
      doc.rect(M, y, TW, 22).fill(LIGHT);
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
         .text('Keine bezahlten Rechnungen im Wirtschaftsjahr.', M + 12, y + 7);
      y += 22;
    } else {
      paidInvoices.forEach((inv, i) => {
        checkPage(22);
        tableRow(invTableCols, inv, i % 2 === 0);
      });
    }

    y += 4;
    sumRow('Summe Betriebseinnahmen', totalIncome, 'green');

    // ═══════════════════════════════════════════════════════════
    // ABSCHNITT B – AUSGABEN
    // ═══════════════════════════════════════════════════════════
    sectionTitle(`Abschnitt B – Betriebsausgaben ${year}`, 'B.');

    // B.1 – Zusammenfassung nach Kategorie
    checkPage(30 + catOrder.length * 22 + 26);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text('B.1 Übersicht nach Kategorie', M, y);
    y += 16;

    const catCols = [
      { label: 'KATEGORIE',  key: d => catLabels[d.cat] || d.cat, x: 0,   w: 220 },
      { label: 'ANZAHL',     key: 'count',    x: 220, w: 80, align: 'right' },
      { label: 'BETRAG',     key: d => fmt(d.sum), x: 300, w: 183, align: 'right' },
    ];
    tableHeader(catCols);

    catOrder.forEach((cat, i) => {
      const sum   = expensesByCategory[cat] || 0;
      const count = expenses.filter(e => e.category === cat).length;
      if (sum === 0) return;
      checkPage(22);
      tableRow(catCols, { cat, sum, count: String(count) }, i % 2 === 0);
    });

    y += 4;
    sumRow('Summe Betriebsausgaben', totalExpenses, 'red');

    // B.2 – Einzelpositionen
    y += 16;
    checkPage(30);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text('B.2 Einzelpositionen', M, y);
    y += 16;

    const expCols = [
      { label: 'BELEGNR.',     key: 'receipt_number',  x: 0,   w: 80 },
      { label: 'DATUM',        key: d => fmtD(d.expense_date), x: 80, w: 62 },
      { label: 'BESCHREIBUNG', key: d => (d.description||'').substring(0, 40), x: 142, w: 170 },
      { label: 'KATEGORIE',    key: d => catLabels[d.category]||d.category, x: 312, w: 100 },
      { label: 'EXT. BELEG',   key: d => d.receipt_ref || '—', x: 412, w: 60 },
      { label: 'BETRAG',       key: d => fmt(d.amount), x: 472, w: 11, align: 'right' },
    ];

    checkPage(22);
    tableHeader(expCols);

    if (expenses.length === 0) {
      doc.rect(M, y, TW, 22).fill(LIGHT);
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
         .text('Keine Ausgaben im Wirtschaftsjahr.', M + 12, y + 7);
      y += 22;
    } else {
      expenses.forEach((exp, i) => {
        checkPage(22);
        tableRow(expCols, exp, i % 2 === 0);
      });
    }

    // ═══════════════════════════════════════════════════════════
    // ABSCHNITT C – GEWINN/VERLUST
    // ═══════════════════════════════════════════════════════════
    sectionTitle(`Abschnitt C – Gewinn / Verlust ${year}`, 'C.');

    sumRow('Betriebseinnahmen (gesamt)',  totalIncome);
    sumRow('Betriebsausgaben (gesamt)',   totalExpenses);

    checkPage(40);
    y += 6;
    doc.rect(M, y, TW, 1.5).fill(BDR);
    y += 8;
    sumRow(`${profit >= 0 ? 'GEWINN' : 'VERLUST'} ${year}`, profit,
           profit >= 0 ? 'accent' : 'red');

    // §19 Hinweis + Unterschrift
    checkPage(100);
    y += 20;
    doc.rect(M, y, TW, 52).fill('#fffbeb').stroke('#fde68a');
    doc.rect(M, y, 4, 52).fill('#f59e0b');
    doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(9)
       .text('Hinweis §19 UStG:', M + 14, y + 8);
    doc.font('Helvetica').text(
      'Gemäß §19 UStG (Kleinunternehmerregelung) erhebt Jeremy Jung / Flowturai keine ' +
      'Umsatzsteuer. Alle ausgewiesenen Beträge sind Nettobeiträge.',
      M + 14, y + 22, { width: TW - 28 }
    );
    y += 64;

    // Unterschriften-Feld
    checkPage(70);
    const sigY = y + 20;
    [[M, 'Ort, Datum'], [W / 2, 'Unterschrift Jeremy Jung / Flowturai']].forEach(([sx, label]) => {
      doc.rect(sx, sigY + 32, W / 2 - M - 20, 0.8).fill(GRAY);
      doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(label, sx, sigY + 37);
    });
    y = sigY + 56;

    // Footer letzte Seite
    doc.rect(0, 775, W, 67).fill(DARK);
    doc.rect(0, 775, W, 3).fill(ACCENT);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(8)
       .text(
         `Jeremy Jung · Flowturai · ${process.env.IONOS_EMAIL || ''} · ${process.env.BUSINESS_ADDRESS || ''}`,
         M, 796, { width: TW, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateEURPDF };
