const PDFDocument = require('pdfkit');

function generateInvoicePDF({ invoice, contact }) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data', c  => chunks.push(c));
    doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', e  => reject(e));

    const W     = 595.28;
    const M     = 56;
    const DARK  = '#040c1a';  // Tiefes Navy (Frontend-Farbe)
    const ACCENT = '#2563EB'; // Flowturai-Blau
    const CYAN  = '#93c5fd';  // Hellblau
    const GRAY  = '#6b7280';
    const LIGHT = '#F5F7FA';  // Off-White
    const BDR   = '#dde3ec';
    const TEXT  = '#1C1C1E';  // Anthrazit
    // Alias für nachfolgende Verwendung
    const BLUE  = ACCENT;

    // Header
    doc.rect(0, 0, W, 90).fill(DARK);
    doc.rect(0, 87, W, 3).fill(ACCENT);

    // Logo-Icon: blaues Quadrat mit Wellen-SVG (wie auf Website)
    doc.roundedRect(M, 24, 32, 32, 6).fill(ACCENT);
    doc.moveTo(M + 6, 42).lineTo(M + 11, 35).lineTo(M + 17, 42).lineTo(M + 22, 35)
       .undash().strokeColor('#ffffff').lineWidth(2.2).lineCap('round').stroke();
    doc.moveTo(M + 6, 50).lineTo(M + 11, 43).lineTo(M + 17, 50).lineTo(M + 22, 43)
       .undash().strokeColor('rgba(255,255,255,0.5)').lineWidth(2.2).lineCap('round').stroke();

    doc.fillColor('#F5F7FA').font('Helvetica-Bold').fontSize(22).text('Flowturai', M + 40, 27);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(10).text('KI-Automatisierung für Ihren Betrieb', M + 40, 54);

    // Absender
    const ADDR = process.env.BUSINESS_ADDRESS || 'Efeuweg 37, 22299 Hamburg';
    doc.fillColor(GRAY).fontSize(8)
       .text(`Flowturai · ${ADDR} · ${process.env.IONOS_EMAIL}`, M, 108);
    doc.rect(M, 120, W - M * 2, 0.5).fill(BDR);

    // Empfänger (B2B: Firma zuerst)
    doc.fillColor(GRAY).fontSize(8).text('RECHNUNG AN', M, 136);
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

    // Rechnungsdetails rechts
    const RX = W / 2 + 30;
    doc.fillColor(GRAY).fontSize(8);
    ['RECHNUNGSNUMMER', 'DATUM', 'FÄLLIG BIS'].forEach((l, i) => doc.text(l, RX, 136 + i * 26));
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10);
    doc.text(invoice.invoice_number, RX + 130, 136);
    doc.text(new Date(invoice.created_at).toLocaleDateString('de-DE'), RX + 130, 162);
    doc.text(new Date(invoice.due_date).toLocaleDateString('de-DE'),   RX + 130, 188);

    // Titel
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(22).text('Rechnung', M, 240);
    doc.rect(M, 268, 44, 3).fill(ACCENT);  // Smaragdgrüne Unterstreichung

    // Tabellen-Header
    doc.rect(M, 290, W - M * 2, 26).fill(DARK);
    // Cyan-Akzentlinie im Header
    doc.rect(M, 316, W - M * 2, 1.5).fill(CYAN);
    doc.fillColor('#F5F7FA').font('Helvetica-Bold').fontSize(9)
       .text('BESCHREIBUNG', M + 12, 300)
       .text('BETRAG', W - M - 68, 300);

    // Tabellenzeile
    doc.rect(M, 316, W - M * 2, 42).fill(LIGHT).stroke(BDR);
    const amtStr = `${parseFloat(invoice.amount).toFixed(2).replace('.', ',')} €`;
    doc.fillColor(TEXT).font('Helvetica').fontSize(10)
       .text(invoice.description || 'Dienstleistung – Flowturai', M + 12, 328, { width: W - M * 2 - 100 });
    doc.font('Helvetica-Bold').text(amtStr, W - M - 68, 328, { width: 56, align: 'right' });

    // Summen-Block
    const sY = 380;
    doc.rect(W / 2, sY, W / 2 - M, 0.5).fill(BDR);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Zwischensumme', W / 2 + 10, sY + 8)
       .text(amtStr, W - M - 68, sY + 8, { width: 56, align: 'right' });
    doc.rect(W / 2, sY + 30, W / 2 - M, 34).fill(ACCENT);
    doc.fillColor('#0D2137').font('Helvetica-Bold').fontSize(11)
       .text('GESAMTBETRAG', W / 2 + 10, sY + 40)
       .text(amtStr, W - M - 68, sY + 40, { width: 56, align: 'right' });

    // §19 UStG Hinweis
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).', M, sY + 78);

    // Bankverbindung
    doc.rect(M, 500, W - M * 2, 74).stroke(BDR);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9).text('BANKVERBINDUNG', M + 14, 512);
    doc.font('Helvetica').fillColor(TEXT).fontSize(9.5)
       .text(`Kontoinhaber: ${process.env.BANK_HOLDER}`,                              M + 14, 527)
       .text(`IBAN: ${process.env.BANK_IBAN}`,                                        M + 14, 541)
       .text(`BIC: ${process.env.BANK_BIC}  ·  ${process.env.BANK_NAME || 'FINOM'}`, M + 14, 555);
    doc.fillColor(GRAY).fontSize(8)
       .text('Verwendungszweck:', W / 2, 527)
       .text(invoice.invoice_number, W / 2, 541);

    // Abschlusstext
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(12).text('Vielen Dank für Ihr Vertrauen!', M, 600);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9.5).text('Wir sind jederzeit für Sie erreichbar.', M, 618);

    // Footer
    doc.rect(0, 780, W, 62).fill(DARK);
    doc.rect(0, 780, W, 3).fill(ACCENT);  // Akzentlinie oben im Footer
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(8)
       .text(`Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${process.env.BUSINESS_ADDRESS || 'Efeuweg 37, 22299 Hamburg'}`,
         M, 800, { width: W - M * 2, align: 'center' });

    doc.end();
  });
}

module.exports = { generateInvoicePDF };
