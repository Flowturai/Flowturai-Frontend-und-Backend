const PDFDocument = require('pdfkit');

/**
 * Generiert ein Mahnschreiben-PDF im Flowturai-Design.
 * @param {{ invoice: object, contact: object, level: number, fee: number }} param0
 */
function generateDunningPDF({ invoice, contact, level, fee }) {
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
    const RED    = '#e53935';
    const GRAY   = '#6b7280';
    const LIGHT  = '#F5F7FA';
    const BDR    = '#dde3ec';
    const TEXT   = '#1C1C1E';

    const levelColor = level === 1 ? '#f59e0b' : RED;

    // ── Header ────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(DARK);
    doc.rect(0, 87, W, 3).fill(levelColor);
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(22).text('Flowturai', M, 27);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(10)
       .text('KI-Automatisierung für Ihren Betrieb', M, 54);
    doc.circle(W - M - 20, 40, 7).fill(ACCENT);
    doc.circle(W - M - 5,  40, 7).fill(CYAN);

    // ── Absender ──────────────────────────────────────────────
    doc.fillColor(GRAY).fontSize(8)
       .text(
         `Jeremy Jung · Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${process.env.BUSINESS_ADDRESS || 'Efeuweg 37, 22299 Hamburg'}`,
         M, 108
       );
    doc.rect(M, 120, W - M * 2, 0.5).fill(BDR);

    // ── Empfänger ─────────────────────────────────────────────
    doc.fillColor(GRAY).fontSize(8).text('AN', M, 136);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(11).text(contact.name, M, 150);
    doc.font('Helvetica').fontSize(10);
    if (contact.company) doc.text(contact.company, M, 165);
    const addrY = contact.company ? 180 : 165;
    if (contact.address) doc.text(contact.address, M, addrY);
    if (contact.city)    doc.text(contact.city,    M, addrY + 14);

    // ── Rechnungs-Details rechts ──────────────────────────────
    const RX = W / 2 + 30;
    doc.fillColor(GRAY).fontSize(8);
    ['RECHNUNGSNUMMER', 'RECHNUNGSDATUM', 'FÄLLIG SEIT'].forEach((l, i) =>
      doc.text(l, RX, 136 + i * 26)
    );
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10);
    doc.text(invoice.invoice_number, RX + 130, 136);
    doc.text(new Date(invoice.created_at).toLocaleDateString('de-DE'), RX + 130, 162);
    doc.text(new Date(invoice.due_date).toLocaleDateString('de-DE'),   RX + 130, 188);

    // ── Mahnungs-Titel ────────────────────────────────────────
    const titleText = level === 1 ? '1. Zahlungserinnerung' : '2. Mahnung';
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(20).text(titleText, M, 240);
    doc.rect(M, 268, level === 1 ? 100 : 66, 3).fill(levelColor);

    // ── Einleitungstext ───────────────────────────────────────
    const intro = level === 1
      ? `wir erlauben uns, Sie freundlich daran zu erinnern, dass die o.g. Rechnung noch offen ist. Vielleicht hat die Zahlung Sie auf dem Postweg gekreuzt – bitte ignorieren Sie dieses Schreiben in diesem Fall.`
      : `trotz unserer 1. Zahlungserinnerung steht der nachfolgende Betrag noch aus. Wir bitten Sie dringend, diesen umgehend zu begleichen, um weitere Schritte zu vermeiden.`;

    doc.fillColor(TEXT).font('Helvetica').fontSize(10.5)
       .text(`Sehr geehrte/r ${contact.name},`, M, 285);
    doc.text(intro, M, 305, { width: W - M * 2 });

    // ── Betragsblock ──────────────────────────────────────────
    const openAmount = parseFloat(invoice.amount) + (fee || 0);
    const boxY = 365;

    doc.rect(M, boxY, W - M * 2, 90).fill(LIGHT).stroke(BDR);
    doc.rect(M, boxY, 4, 90).fill(levelColor);

    doc.fillColor(GRAY).font('Helvetica').fontSize(9);
    doc.text('Offener Betrag',        M + 20, boxY + 14);
    doc.text('Rechnungsnummer',       M + 20, boxY + 30);
    doc.text('Zahlungsdatum (übf.)',  M + 20, boxY + 46);
    if (fee > 0) doc.text(`Mahngebühr (Stufe ${level})`, M + 20, boxY + 62);

    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10);
    doc.text(
      `${parseFloat(invoice.amount).toFixed(2).replace('.', ',')} €`,
      W / 2, boxY + 14
    );
    doc.font('Helvetica').text(invoice.invoice_number, W / 2, boxY + 30);
    doc.text(new Date(invoice.due_date).toLocaleDateString('de-DE'), W / 2, boxY + 46);
    if (fee > 0) {
      doc.fillColor(RED).text(`+ ${fee.toFixed(2).replace('.', ',')} €`, W / 2, boxY + 62);
    }

    // Gesamtbetrag-Hervorhebung
    const totalY = boxY + (fee > 0 ? 75 : 65);
    doc.rect(W / 2 - 10, totalY - 4, W / 2 - M + 10, 22).fill(levelColor);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
       .text('GESAMTBETRAG', W / 2, totalY)
       .text(
         `${openAmount.toFixed(2).replace('.', ',')} €`,
         W - M - 100, totalY
       );

    // ── Bankverbindung ────────────────────────────────────────
    const bankY = boxY + 108;
    doc.rect(M, bankY, W - M * 2, 74).stroke(BDR);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9).text('BANKVERBINDUNG', M + 14, bankY + 12);
    doc.font('Helvetica').fillColor(TEXT).fontSize(9.5)
       .text(`Kontoinhaber: ${process.env.BANK_HOLDER}`, M + 14, bankY + 27)
       .text(`IBAN: ${process.env.BANK_IBAN}`,           M + 14, bankY + 41)
       .text(`BIC: ${process.env.BANK_BIC}`,             M + 14, bankY + 55);
    doc.fillColor(GRAY).fontSize(8)
       .text('Verwendungszweck:', W / 2, bankY + 27)
       .text(invoice.invoice_number, W / 2, bankY + 41);

    // ── Schlusstext ───────────────────────────────────────────
    const closeY = bankY + 92;
    doc.fillColor(TEXT).font('Helvetica').fontSize(10.5)
       .text(
         level === 1
           ? 'Bitte überweisen Sie den offenen Betrag innerhalb von 7 Tagen. Sollte es Rückfragen geben, sprechen Sie mich gerne an.'
           : 'Bitte überweisen Sie den Gesamtbetrag innerhalb von 7 Tagen. Bei ausbleibender Zahlung behalten wir uns rechtliche Schritte vor.',
         M, closeY, { width: W - M * 2 }
       );

    doc.fillColor(GRAY).fontSize(9).text('Mit freundlichen Grüßen,', M, closeY + 38);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10)
       .text('Jeremy Jung · Flowturai', M, closeY + 53);

    // ── Footer ────────────────────────────────────────────────
    doc.rect(0, 780, W, 62).fill(DARK);
    doc.rect(0, 780, W, 3).fill(levelColor);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(8)
       .text(
         `Jeremy Jung · Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${process.env.BUSINESS_ADDRESS || 'Efeuweg 37, 22299 Hamburg'}`,
         M, 800, { width: W - M * 2, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateDunningPDF };
