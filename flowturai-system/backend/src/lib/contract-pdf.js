const PDFDocument = require('pdfkit');

function generateContractPDF({ contract, contact, offerLineItems }) {
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

    const isBetreuung = contract.type !== 'implementierung';
    const typeLabel   = isBetreuung ? 'Betreuungsvertrag' : 'Implementierungsvertrag';

    // ── Header ────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(DARK);
    doc.rect(0, 87, W, 3).fill(ACCENT);

    // Logo-Icon
    doc.roundedRect(M, 24, 32, 32, 6).fill(ACCENT);
    doc.moveTo(M + 6, 42).lineTo(M + 11, 35).lineTo(M + 17, 42).lineTo(M + 22, 35)
       .undash().strokeColor('#ffffff').lineWidth(2.2).lineCap('round').stroke();
    doc.moveTo(M + 6, 50).lineTo(M + 11, 43).lineTo(M + 17, 50).lineTo(M + 22, 43)
       .undash().strokeColor('rgba(255,255,255,0.5)').lineWidth(2.2).lineCap('round').stroke();

    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(22).text('Flowturai', M + 40, 27);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(10).text('KI-Automatisierung für Ihren Betrieb', M + 40, 54);

    // ── Absender-Zeile ────────────────────────────────────────
    const ADDR = process.env.BUSINESS_ADDRESS || 'Efeuweg 37, 22299 Hamburg';
    doc.fillColor(GRAY).fontSize(8)
       .text(`Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${ADDR}`, M, 108);
    doc.rect(M, 120, W - M * 2, 0.5).fill(BDR);

    // ── Vertragsparteien ──────────────────────────────────────
    // Linke Seite: Auftraggeber (B2B: Firma zuerst)
    doc.fillColor(GRAY).fontSize(8).text('AUFTRAGGEBER', M, 136);
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

    // Rechte Seite: Auftragnehmer
    const RX = W / 2 + 20;
    doc.fillColor(GRAY).fontSize(8).text('AUFTRAGNEHMER', RX, 136);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(11).text('Flowturai', RX, 150);
    doc.font('Helvetica').fontSize(10).text(ADDR, RX, 165);
    doc.text(process.env.IONOS_EMAIL || 'info@flowturai.de', RX, 180);

    // Vertragsnummer + Datum
    doc.fillColor(GRAY).fontSize(8).text('VERTRAGSNUMMER', RX, 200);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10).text(contract.contract_number, RX + 120, 200);
    doc.fillColor(GRAY).fontSize(8).text('DATUM', RX, 216);
    doc.fillColor(TEXT).font('Helvetica').fontSize(10)
       .text(new Date(contract.start_date || contract.created_at).toLocaleDateString('de-DE'), RX + 120, 216);

    // ── Titel ─────────────────────────────────────────────────
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(22).text(typeLabel, M, 250);
    doc.rect(M, 278, isBetreuung ? 158 : 194, 3).fill(ACCENT);

    // ── Paket-/Leistungsübersicht (wie Angebot) ───────────────
    const lineItems = Array.isArray(offerLineItems) && offerLineItems.length > 0
      ? offerLineItems
      : (contract.notes ? [{ desc: contract.notes, qty: 1, price: parseFloat(contract.amount || 0) }] : []);

    const tableTop = 300;

    // Tabellen-Header: POS | BESCHREIBUNG | MENGE | GESAMT
    doc.rect(M, tableTop, W - M * 2, 26).fill(DARK);
    doc.rect(M, tableTop + 26, W - M * 2, 1.5).fill(CYAN);
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(9);
    doc.text('POS',          M + 12,      tableTop + 9);
    doc.text('BESCHREIBUNG', M + 42,      tableTop + 9);
    doc.text('MENGE',        W - M - 118, tableTop + 9);
    doc.text('GESAMT',       W - M - 52,  tableTop + 9, { width: 40, align: 'right' });

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
    const totalAmount = parseFloat(contract.amount || 0);
    const amtStr      = `${totalAmount.toFixed(2).replace('.', ',')} €`;
    const sumY        = rowY + 12;

    doc.rect(W / 2, sumY, W / 2 - M, 0.5).fill(BDR);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Zwischensumme', W / 2 + 10, sumY + 8)
       .text(amtStr, W - M - 52, sumY + 8, { width: 40, align: 'right' });

    doc.rect(W / 2, sumY + 30, W / 2 - M, 34).fill(ACCENT);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
       .text(isBetreuung ? 'MONATLICHER BETRAG' : 'GESAMTBETRAG', W / 2 + 10, sumY + 40)
       .text(amtStr, W - M - 52, sumY + 40, { width: 40, align: 'right' });

    // ── Laufzeit-Info ─────────────────────────────────────────
    const infoY = sumY + 78;
    doc.rect(M, infoY, W - M * 2, 32).fill(LIGHT).stroke(BDR);
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text('Vertragsbeginn:', M + 12, infoY + 8);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
       .text(
         new Date(contract.start_date || contract.created_at).toLocaleDateString('de-DE'),
         M + 100, infoY + 8
       );
    if (isBetreuung) {
      doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
         .text('Laufzeit:', M + 200, infoY + 8);
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
         .text('Unbegrenzt, kündbar mit 30 Tagen Frist', M + 255, infoY + 8);
    }
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text('Zahlungsintervall:', M + 12, infoY + 20);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
       .text(isBetreuung ? 'Monatlich' : 'Einmalig nach Projektabschluss', M + 100, infoY + 20);

    // ── §19 UStG ──────────────────────────────────────────────
    const ustY = infoY + 46;
    doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
       .text('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).', M, ustY);

    // ── Unterschriften ────────────────────────────────────────
    const sigY = Math.max(ustY + 30, 660);
    doc.rect(M,           sigY, (W - M * 2) / 2 - 10, 0.5).fill(DARK);
    doc.rect(W / 2 + 10,  sigY, (W - M * 2) / 2 - 10, 0.5).fill(DARK);
    doc.fillColor(GRAY).fontSize(8)
       .text('Ort, Datum, Unterschrift Auftraggeber', M, sigY + 6)
       .text('Ort, Datum, Unterschrift Auftragnehmer', W / 2 + 10, sigY + 6);

    // ── AGB/Datenschutz-Hinweis ───────────────────────────────
    const agbY = sigY + 28;
    doc.fillColor(GRAY).font('Helvetica').fontSize(8)
       .text(
         'Mit der Vertragsunterzeichnung stimmt der Auftraggeber den Allgemeinen Geschäftsbedingungen (AGB) und den ' +
         'Datenschutzbestimmungen von Flowturai zu (abrufbar unter flowturai.de).',
         M, agbY, { width: W - M * 2 }
       );

    // ── Footer ────────────────────────────────────────────────
    doc.rect(0, 780, W, 62).fill(DARK);
    doc.rect(0, 780, W, 3).fill(ACCENT);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(8)
       .text(
         `Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${ADDR}`,
         M, 795, { width: W - M * 2, align: 'center' }
       );
    doc.text(
      `Vertragsnummer: ${contract.contract_number}  ·  ${typeLabel}`,
      M, 810, { width: W - M * 2, align: 'center' }
    );

    // ── Seite 2: Vertragsbedingungen (Kleingedrucktes) ────────
    doc.addPage();

    doc.rect(0, 0, W, 50).fill(DARK);
    doc.rect(0, 47, W, 2).fill(ACCENT);
    doc.fillColor(LIGHT).font('Helvetica-Bold').fontSize(14)
       .text('Vertragsbedingungen – Allgemeine Bestimmungen', M, 16);

    let y = 70;
    const smallSection = (title) => {
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9).text(title, M, y);
      y += 14;
      doc.rect(M, y - 2, W - M * 2, 0.5).fill(BDR);
      y += 4;
    };
    const smallPara = (text) => {
      doc.fillColor(TEXT).font('Helvetica').fontSize(8)
         .text(text, M, y, { width: W - M * 2, lineGap: 2 });
      y += doc.heightOfString(text, { width: W - M * 2, lineGap: 2 }) + 8;
    };

    if (isBetreuung) {
      smallSection('§ 1 Vertragsgegenstand');
      smallPara(`Flowturai (Jeremy Jung) verpflichtet sich, dem Auftraggeber laufende technische Betreuung und Optimierung der eingesetzten KI-Automatisierungslösungen zu erbringen. Leistungsumfang: ${contract.notes || 'laufende Betreuung, Optimierung, Support bei Fragen und Fehlern, monatliche Auswertungen'}. Der monatliche Pauschalpreis beträgt ${parseFloat(contract.amount || 0).toFixed(2).replace('.', ',')} € (netto, gem. § 19 UStG).`);

      smallSection('§ 2 Laufzeit & Kündigung');
      smallPara(`Der Vertrag beginnt am ${new Date(contract.start_date || contract.created_at).toLocaleDateString('de-DE')} und läuft auf unbestimmte Zeit. Er kann von beiden Seiten mit einer Frist von 30 Tagen zum Monatsende schriftlich (per E-Mail) gekündigt werden.`);

      smallSection('§ 3 Abrechnung & Zahlung');
      smallPara('Die Abrechnung erfolgt monatlich zu Beginn des Abrechnungsmonats per Rechnung. Zahlungsziel: 14 Tage nach Rechnungseingang. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.');

    } else {
      smallSection('§ 1 Vertragsgegenstand');
      smallPara(`Flowturai (Jeremy Jung) verpflichtet sich, für den Auftraggeber folgendes Implementierungsprojekt durchzuführen: ${contract.notes || 'Implementierung und Einrichtung von KI-Automatisierungslösungen gemäß Angebot'}. Das Projekt wird als Einmalprojekt für einen Gesamtpreis von ${parseFloat(contract.amount || 0).toFixed(2).replace('.', ',')} € (netto, gem. § 19 UStG) durchgeführt.`);

      smallSection('§ 2 Projektablauf');
      smallPara('Die Umsetzung erfolgt nach Freigabe dieses Vertrags. Meilensteine und Abnahmekriterien werden separat definiert. Änderungswünsche außerhalb des vereinbarten Umfangs werden gesondert angeboten.');

      smallSection('§ 3 Zahlung');
      smallPara('Die Rechnung wird nach Projektabschluss und Abnahme ausgestellt. Zahlungsziel: 14 Tage nach Rechnungseingang. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.');
    }

    smallSection('§ 4 Haftung & Datenschutz');
    smallPara('Flowturai haftet nicht für mittelbare Schäden oder entgangenen Gewinn. Die Haftung ist auf den Auftragswert begrenzt. Personenbezogene Daten werden ausschließlich zur Vertragserfüllung gemäß DSGVO verarbeitet. Es gilt eine AV-Vereinbarung nach Art. 28 DSGVO sofern personenbezogene Daten verarbeitet werden.');

    smallSection('§ 5 Anwendbares Recht');
    smallPara('Es gilt deutsches Recht. Gerichtsstand ist Hamburg.');

    // Footer Seite 2
    doc.rect(0, 780, W, 62).fill(DARK);
    doc.rect(0, 780, W, 3).fill(ACCENT);
    doc.fillColor('#8ea5b8').font('Helvetica').fontSize(8)
       .text(
         `Flowturai · +49 (0) 15228352609 · ${process.env.IONOS_EMAIL || 'info@flowturai.de'} · ${ADDR}`,
         M, 795, { width: W - M * 2, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateContractPDF };
