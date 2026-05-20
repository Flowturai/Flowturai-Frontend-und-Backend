const PDFDocument = require('pdfkit');

function generateOfferPDF({ offer, contact }) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data', c  => chunks.push(c));
    doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', e  => reject(e));

    const W      = 595.28;
    const M      = 56;
    const DARK   = '#040c1a';
    const ACCENT = '#2563EB';
    const CYAN   = '#93c5fd';
    const GRAY   = '#6b7280';
    const LIGHT  = '#F5F7FA';
    const BDR    = '#dde3ec';
    const TEXT   = '#1C1C1E';

    // ── Header ────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(DARK);
    doc.rect(0, 87, W, 3).fill(ACCENT);

    // Logo-Icon: blaues Quadrat mit Wellen-SVG (wie auf Website)
    doc.roundedRect(M, 24, 32, 32, 6).fill(ACCENT);
    // Welle 1 (voll weiß)
    doc.moveTo(M + 6, 42).lineTo(M + 11, 35).lineTo(M + 17, 42).lineTo(M + 22, 35)
       .undash().strokeColor('#ffffff').lineWidth(2.2).lineCap('round').stroke();
    // Welle 2 (50% weiß)
    doc.moveTo(M + 6, 50).lineTo(M + 11, 43).lineTo(M + 17, 50).lineTo(M + 22, 43)
       .undash().strokeColor('rgba(255,255,255,0.5)').lineWidth(2.2).lineCap('round').stroke();

    // Markenname
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(22).text('Flowturai', M + 40, 27);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(10).text('KI-Automatisierung für Ihren Betrieb', M + 40, 54);

    // ── Absender-Zeile ────────────────────────────────────────
    const ADDR = process.env.BUSINESS_ADDRESS || 'Efeuweg 37, 22299 Hamburg';
    doc.fillColor(GRAY).fontSize(8)
       .text(`Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${ADDR}`, M, 108);
    doc.rect(M, 120, W - M * 2, 0.5).fill(BDR);

    // ── Empfänger (B2B: Firma zuerst) ────────────────────────
    doc.fillColor(GRAY).fontSize(8).text('ANGEBOT AN', M, 136);
    if (contact.company) {
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(11).text(contact.company, M, 150);
      doc.font('Helvetica').fontSize(10).text(contact.name, M, 165);
      if (contact.address) doc.text(contact.address, M, 180);
      if (contact.city)    doc.text(contact.city,    M, 194);
    } else {
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(11).text(contact.name, M, 150);
      doc.font('Helvetica').fontSize(10);
      if (contact.address) doc.text(contact.address, M, 165);
      if (contact.city)    doc.text(contact.city,    M, 179);
    }

    // ── Angebots-Details rechts ───────────────────────────────
    const RX = W / 2 + 30;
    doc.fillColor(GRAY).fontSize(8);
    ['ANGEBOTSNUMMER', 'DATUM', 'GÜLTIG BIS'].forEach((l, i) =>
      doc.text(l, RX, 136 + i * 26)
    );
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10);
    doc.text(offer.offer_number, RX + 130, 136);
    doc.text(new Date(offer.created_at || Date.now()).toLocaleDateString('de-DE'), RX + 130, 162);
    doc.text(new Date(offer.valid_until).toLocaleDateString('de-DE'), RX + 130, 188);

    // ── Titel ─────────────────────────────────────────────────
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(22).text('Angebot', M, 240);
    doc.rect(M, 268, 36, 3).fill(CYAN);

    // ── Positions-Tabelle (ohne Einzelpreis) ──────────────────
    const lineItems = Array.isArray(offer.line_items)
      ? offer.line_items
      : (typeof offer.line_items === 'string' ? JSON.parse(offer.line_items) : []);

    const tableTop = 290;

    // Header-Zeile: POS | BESCHREIBUNG | MENGE | GESAMT
    doc.rect(M, tableTop, W - M * 2, 26).fill(DARK);
    doc.rect(M, tableTop + 26, W - M * 2, 1.5).fill(CYAN);
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(9);
    doc.text('POS',          M + 12,       tableTop + 9);
    doc.text('BESCHREIBUNG', M + 42,       tableTop + 9);
    doc.text('MENGE',        W - M - 118,  tableTop + 9);
    doc.text('GESAMT',       W - M - 52,   tableTop + 9, { width: 40, align: 'right' });

    // Positions-Zeilen
    let rowY = tableTop + 27;
    const ROW_H = 36;

    lineItems.forEach((item, idx) => {
      const qty   = parseFloat(item.qty   || 1);
      const price = parseFloat(item.price || 0);
      const total = qty * price;
      const bg    = idx % 2 === 0 ? '#ffffff' : LIGHT;

      doc.rect(M, rowY, W - M * 2, ROW_H).fill(bg).stroke(BDR);

      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
         .text(String(idx + 1), M + 12, rowY + 13);
      doc.fillColor(TEXT).fontSize(10)
         .text(item.desc || '—', M + 42, rowY + 11, { width: W - M * 2 - 200, ellipsis: true });
      doc.fillColor(GRAY).fontSize(9)
         .text(qty % 1 === 0 ? String(qty) : qty.toFixed(2), W - M - 118, rowY + 13);
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
         .text(
           `${total.toFixed(2).replace('.', ',')} €`,
           W - M - 52, rowY + 13, { width: 40, align: 'right' }
         );

      rowY += ROW_H;
    });

    // ── Summen-Block ──────────────────────────────────────────
    const totalAmount = parseFloat(offer.amount || 0);
    const amtStr      = `${totalAmount.toFixed(2).replace('.', ',')} €`;
    const sumY        = rowY + 12;

    doc.rect(W / 2, sumY, W / 2 - M, 0.5).fill(BDR);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Zwischensumme', W / 2 + 10, sumY + 8)
       .text(amtStr, W - M - 52, sumY + 8, { width: 40, align: 'right' });

    doc.rect(W / 2, sumY + 30, W / 2 - M, 34).fill(ACCENT);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
       .text('GESAMTBETRAG', W / 2 + 10, sumY + 40)
       .text(amtStr, W - M - 52, sumY + 40, { width: 40, align: 'right' });

    // ── §19 UStG + AGB/Datenschutz ────────────────────────────
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(
         'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).',
         M, sumY + 78
       );
    doc.fillColor(GRAY).fontSize(8)
       .text(
         'Mit der Angebotsbestätigung stimmt der Auftraggeber den Allgemeinen Geschäftsbedingungen (AGB) und den\n' +
         'Datenschutzbestimmungen von Flowturai zu (abrufbar unter flowturai.de).',
         M, sumY + 94, { width: W - M * 2 }
       );

    // ── Notizen ───────────────────────────────────────────────
    const legalH = 30;
    if (offer.notes) {
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
         .text('HINWEISE', M, sumY + 94 + legalH);
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
         .text(offer.notes, M, sumY + 108 + legalH, { width: W - M * 2 });
    }

    // ── Abschluss ─────────────────────────────────────────────
    const closeY = Math.max(sumY + (offer.notes ? 150 : 130), 640);
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(12)
       .text('Wir freuen uns auf eine erfolgreiche Zusammenarbeit!', M, closeY);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9.5)
       .text('Wir sind jederzeit für Sie erreichbar.', M, closeY + 17);

    // ── Footer ────────────────────────────────────────────────
    doc.rect(0, 780, W, 62).fill(DARK);
    doc.rect(0, 780, W, 3).fill(ACCENT);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(8)
       .text(
         `Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${ADDR}`,
         M, 800, { width: W - M * 2, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateOfferPDF };
