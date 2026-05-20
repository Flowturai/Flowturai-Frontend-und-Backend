const PDFDocument = require('pdfkit');

/**
 * Generiert ein professionelles Rechnungs-PDF (A4)
 * Berücksichtigt §19 UStG (Kleinunternehmerregelung – keine MwSt.)
 */
function generateInvoicePDF({ invoice, contact }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 595.28;
    const DARK = '#0f172a';
    const BLUE = '#1e40af';
    const GRAY = '#64748b';
    const LIGHT = '#f8fafc';
    const BORDER = '#e2e8f0';
    const TEXT = '#1e293b';
    const M = 56; // Seitenrand

    // ── Header-Balken ─────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(DARK);

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20)
       .text('Flowturai', M, 28);
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(10)
       .text('KI-Automatisierung für Ihren Betrieb', M, 52);

    // Kleines Akzent-Rechteck
    doc.rect(W - M - 28, 26, 28, 28).fill(BLUE);

    // ── Absender (klein, unter Header) ────────────────────────
    doc.fillColor(GRAY).font('Helvetica').fontSize(8)
       .text(
         `Jeremy Jung · Flowturai · ${process.env.BUSINESS_ADDRESS || 'Musterstraße 1, 12345 Musterstadt'} · hallo@flowturai.de`,
         M, 108
       );

    // Trennlinie
    doc.rect(M, 120, W - M * 2, 0.5).fill(BORDER);

    // ── Empfänger ─────────────────────────────────────────────
    doc.fillColor(GRAY).fontSize(8).text('RECHNUNG AN', M, 136);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(11)
       .text(contact.name, M, 150);
    doc.font('Helvetica').fontSize(10).fillColor(TEXT);
    if (contact.company) doc.text(contact.company, M, 165);
    const addrY = contact.company ? 180 : 165;
    if (contact.address) doc.text(contact.address, M, addrY);
    if (contact.city)    doc.text(contact.city,    M, addrY + 14);

    // ── Rechnungsdetails (rechts) ──────────────────────────────
    const RX = W / 2 + 30;
    doc.fillColor(GRAY).fontSize(8);
    doc.text('RECHNUNGSNUMMER', RX, 136);
    doc.text('DATUM',           RX, 162);
    doc.text('FÄLLIG BIS',      RX, 188);

    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10);
    doc.text(invoice.invoice_number,                                        RX + 130, 136);
    doc.text(new Date(invoice.created_at).toLocaleDateString('de-DE'),      RX + 130, 162);
    doc.text(new Date(invoice.due_date).toLocaleDateString('de-DE'),        RX + 130, 188);

    // ── Rechnungstitel ────────────────────────────────────────
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(22)
       .text('Rechnung', M, 240);
    doc.rect(M, 268, 40, 3).fill(BLUE);

    // ── Tabellen-Header ───────────────────────────────────────
    doc.rect(M, 290, W - M * 2, 26).fill(DARK);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
       .text('BESCHREIBUNG',  M + 12, 300)
       .text('BETRAG',        W - M - 68, 300);

    // ── Tabellenzeile ─────────────────────────────────────────
    doc.rect(M, 316, W - M * 2, 42).fill(LIGHT);
    doc.rect(M, 316, W - M * 2, 42).stroke(BORDER);

    doc.fillColor(TEXT).font('Helvetica').fontSize(10)
       .text(invoice.description || 'Dienstleistung – Flowturai', M + 12, 326, { width: W - M * 2 - 100 });

    const amountStr = `${parseFloat(invoice.amount).toFixed(2).replace('.', ',')} €`;
    doc.font('Helvetica-Bold')
       .text(amountStr, W - M - 68, 326, { width: 56, align: 'right' });

    // ── Summen-Block ──────────────────────────────────────────
    const sumY = 380;
    doc.rect(W / 2, sumY, W / 2 - M, 0.5).fill(BORDER);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Zwischensumme', W / 2 + 10, sumY + 8)
       .text(amountStr, W - M - 68, sumY + 8, { width: 56, align: 'right' });

    doc.rect(W / 2, sumY + 26, W / 2 - M, 0.5).fill(BORDER);

    doc.rect(W / 2, sumY + 30, W / 2 - M, 34).fill(DARK);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
       .text('GESAMTBETRAG', W / 2 + 10, sumY + 40)
       .text(amountStr, W - M - 68, sumY + 40, { width: 56, align: 'right' });

    // ── Kleinunternehmerhinweis ───────────────────────────────
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text(
         'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).',
         M, sumY + 78
       );

    // ── Bankverbindung ────────────────────────────────────────
    const bankY = 500;
    doc.rect(M, bankY, W - M * 2, 74).stroke(BORDER);

    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
       .text('BANKVERBINDUNG', M + 14, bankY + 12);
    doc.fillColor(TEXT).font('Helvetica').fontSize(9.5);
    doc.text(`Kontoinhaber: ${process.env.BANK_HOLDER || 'Jeremy Jung'}`,                  M + 14, bankY + 27);
    doc.text(`IBAN: ${process.env.BANK_IBAN || 'DE00 0000 0000 0000 0000 00'}`,            M + 14, bankY + 41);
    doc.text(`BIC: ${process.env.BANK_BIC || 'XXXXXXXX'}`,                                 M + 14, bankY + 55);

    // Verwendungszweck rechts
    doc.fillColor(GRAY).fontSize(8)
       .text('Verwendungszweck:', W / 2, bankY + 27)
       .text(invoice.invoice_number, W / 2, bankY + 41, { width: W / 2 - M - 14 });

    // ── Dankesnachricht ───────────────────────────────────────
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(12)
       .text('Vielen Dank für Ihr Vertrauen!', M, 600);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9.5)
       .text('Bei Fragen stehe ich jederzeit zur Verfügung.', M, 618);

    // ── Footer ────────────────────────────────────────────────
    doc.rect(0, 780, W, 62).fill(DARK);
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(8)
       .text(
         `Jeremy Jung · Flowturai · hallo@flowturai.de · ${process.env.BUSINESS_ADDRESS || 'Musterstraße 1, 12345 Musterstadt'}`,
         M, 800, { width: W - M * 2, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateInvoicePDF };
