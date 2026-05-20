/**
 * IMAP Posteingang – KI-gestützte Verarbeitung
 * Analysiert ALLE eingehenden Mails mit Claude AI.
 * Mögliche Aktionen:
 *   angebot_angenommen  → Rechnung + Vertrag senden
 *   rechnung_anfrage    → offene Rechnung suchen + senden
 *   vertrag_anfrage     → Vertrag senden
 *   allgemeine_anfrage  → für manuelle Bearbeitung loggen
 *   spam/sonstiges      → nur loggen
 */

const Anthropic = require('@anthropic-ai/sdk');
const { query, nextInvoiceNumber } = require('../lib/db');
const { generateInvoicePDF }       = require('../lib/pdf');
const { generateContractPDF }      = require('../lib/contract-pdf');
const { generateOfferPDF }         = require('../lib/offer-pdf');
const { sendEmail }                = require('../lib/email');
const { sendWhatsApp, notify }     = require('../lib/whatsapp');

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── KI-Analyse einer eingehenden Mail ──────────────────────────
async function analyzeEmail({ subject, body, fromEmail }) {
  const prompt = `Du bist ein intelligenter E-Mail-Assistent für Flowturai (KI-Beratung für Handwerk/Kleinbetriebe).

Analysiere diese eingehende E-Mail und bestimme die AKTION und extrahiere relevante Daten.

VON: ${fromEmail}
BETREFF: ${subject}
INHALT:
${body.substring(0, 1500)}

Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Text darum):
{
  "action": "angebot_angenommen" | "rechnung_anfrage" | "vertrag_anfrage" | "allgemeine_anfrage" | "sonstiges",
  "offer_number": "AN-YYYY-NNN oder null",
  "invoice_number": "FT-YYYY-NNN oder null",
  "contract_number": "VT-YYYY-NNN oder null",
  "summary": "1-2 Satz Zusammenfassung was der Kunde will",
  "confidence": 0.0 bis 1.0
}

Regeln:
- "angebot_angenommen": Kunde stimmt explizit einem Angebot zu (ja, einverstanden, nehme an, accepted, deal, ok, bestätige)
- "rechnung_anfrage": Kunde fragt nach Rechnung, möchte zahlen, bittet um Zahlungsinfos
- "vertrag_anfrage": Kunde fragt nach Vertrag, möchte Vertrag haben/unterschreiben
- "allgemeine_anfrage": Fragen, Rückmeldungen, sonstige Kommunikation die Aufmerksamkeit braucht
- "sonstiges": Spam, automatische Mails, Newsletter`;

  try {
    const msg = await ai.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].text.trim();
    return JSON.parse(text);
  } catch (e) {
    console.warn('[Inbox AI] Analyse-Fehler:', e.message);
    return { action: 'sonstiges', summary: 'KI-Analyse fehlgeschlagen', confidence: 0 };
  }
}

// ── Angebot angenommen → Rechnung + Vertrag senden ────────────
async function handleOfferAccepted(offerNumber, fromEmail) {
  const { rows: [offer] } = await query(
    `SELECT o.*, c.name, c.email, c.company, c.address, c.city
     FROM offers o JOIN contacts c ON c.id = o.contact_id
     WHERE o.offer_number = $1 AND o.status = 'offen'`,
    [offerNumber]
  );
  if (!offer) return null;

  const contact = { id: offer.contact_id, name: offer.name, email: offer.email || fromEmail, company: offer.company, address: offer.address, city: offer.city };

  // Rechnung anlegen
  const invoiceNumber = await nextInvoiceNumber();
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
  const { rows: [invoice] } = await query(
    `INSERT INTO invoices (contact_id, offer_id, invoice_number, amount, description, line_items, due_date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'sent') RETURNING *`,
    [offer.contact_id, offer.id, invoiceNumber, offer.amount, offer.description, offer.line_items, dueDate.toISOString().split('T')[0]]
  );
  await query(`UPDATE offers SET status='angenommen', invoice_id=$1 WHERE id=$2`, [invoice.id, offer.id]);

  // Vertrag anlegen
  const yr  = new Date().getFullYear();
  const { rows: [seq] } = await query(
    `INSERT INTO doc_sequences (key, val) VALUES ($1,1) ON CONFLICT (key) DO UPDATE SET val=doc_sequences.val+1, updated_at=NOW() RETURNING val`,
    [`contract_${yr}`]
  );
  const contractNumber = `VT-${yr}-${String(seq.val).padStart(3,'0')}`;
  const { rows: [contract] } = await query(
    `INSERT INTO contracts (contact_id, offer_id, contract_number, type, amount, start_date, status, notes)
     VALUES ($1,$2,$3,'implementierung',$4,CURRENT_DATE,'aktiv',$5) RETURNING *`,
    [offer.contact_id, offer.id, contractNumber, offer.amount, `Aus Angebot ${offerNumber}`]
  );

  // PDFs + Versand
  const [invoicePdf, contractPdf] = await Promise.all([
    generateInvoicePDF({ invoice, contact }),
    generateContractPDF({ contract, contact }),
  ]);
  const anrede = contact.company ? `Liebes ${contact.company} Team` : 'Guten Tag';
  await sendEmail({
    to:      contact.email,
    subject: `Angebot angenommen – Rechnung ${invoiceNumber} & Vertrag`,
    body:    `${anrede},\n\nvielen Dank, dass Sie unser Angebot ${offerNumber} angenommen haben!\n\nAnbei erhalten Sie:\n• Rechnung ${invoiceNumber} (Zahlungsziel: 14 Tage)\n• Vertrag ${contractNumber}\n\nBitte überweisen Sie den Rechnungsbetrag und senden Sie uns den unterschriebenen Vertrag zurück.\n\nDein Flowturai Team`,
    attachments: [
      { filename: `Rechnung-${invoiceNumber}.pdf`,     content: invoicePdf.toString('base64'),   content_type: 'application/pdf' },
      { filename: `Vertrag-${contractNumber}.pdf`,     content: contractPdf.toString('base64'),  content_type: 'application/pdf' },
    ],
  });

  await sendWhatsApp(notify.offerAccepted(contact.name, offerNumber, invoiceNumber, contractNumber));
  console.log(`[Inbox] Angebot ${offerNumber} angenommen → Rechnung ${invoiceNumber} + Vertrag ${contractNumber}`);
  return { invoiceNumber, contractNumber, contactId: offer.contact_id };
}

// ── Rechnungsanfrage → offene Rechnung senden ─────────────────
async function handleInvoiceRequest(fromEmail, invoiceNumber) {
  // Kontakt via E-Mail finden
  const { rows: [contact] } = await query(
    `SELECT * FROM contacts WHERE LOWER(email)=LOWER($1) LIMIT 1`, [fromEmail]
  );
  if (!contact) return null;

  // Spezifische Rechnung oder letzte offene
  let inv;
  if (invoiceNumber) {
    const { rows: [r] } = await query(`SELECT * FROM invoices WHERE invoice_number=$1`, [invoiceNumber]);
    inv = r;
  } else {
    const { rows: [r] } = await query(
      `SELECT * FROM invoices WHERE contact_id=$1 AND status='sent' ORDER BY created_at DESC LIMIT 1`,
      [contact.id]
    );
    inv = r;
  }
  if (!inv) return null;

  const pdfBuf = await generateInvoicePDF({ invoice: inv, contact });
  const anrede = contact.company ? `Liebes ${contact.company} Team` : 'Guten Tag';
  await sendEmail({
    to:      contact.email,
    subject: `Ihre Rechnung ${inv.invoice_number} – Flowturai`,
    body:    `${anrede},\n\nanbei erhalten Sie Ihre Rechnung ${inv.invoice_number}.\n\nBei Fragen stehen wir jederzeit zur Verfügung.\n\nDein Flowturai Team`,
    attachments: [{ filename: `Rechnung-${inv.invoice_number}.pdf`, content: pdfBuf.toString('base64'), content_type: 'application/pdf' }],
  });

  console.log(`[Inbox] Rechnungsanfrage von ${fromEmail} → Rechnung ${inv.invoice_number} gesendet`);
  return { invoiceNumber: inv.invoice_number, contactId: contact.id };
}

// ── Vertragsanfrage → aktiven Vertrag senden ──────────────────
async function handleContractRequest(fromEmail) {
  const { rows: [contact] } = await query(
    `SELECT * FROM contacts WHERE LOWER(email)=LOWER($1) LIMIT 1`, [fromEmail]
  );
  if (!contact) return null;

  const { rows: [ct] } = await query(
    `SELECT * FROM contracts WHERE contact_id=$1 AND status='aktiv' ORDER BY created_at DESC LIMIT 1`,
    [contact.id]
  );
  if (!ct) return null;

  const pdfBuf = await generateContractPDF({ contract: ct, contact });
  const anrede = contact.company ? `Liebes ${contact.company} Team` : 'Guten Tag';
  await sendEmail({
    to:      contact.email,
    subject: `Ihr Vertrag ${ct.contract_number} – Flowturai`,
    body:    `${anrede},\n\nanbei erhalten Sie Ihren Vertrag ${ct.contract_number}.\n\nDein Flowturai Team`,
    attachments: [{ filename: `Vertrag-${ct.contract_number}.pdf`, content: pdfBuf.toString('base64'), content_type: 'application/pdf' }],
  });

  console.log(`[Inbox] Vertragsanfrage von ${fromEmail} → Vertrag ${ct.contract_number} gesendet`);
  return { contractNumber: ct.contract_number, contactId: contact.id };
}

// ── Inbox-Log ─────────────────────────────────────────────────
async function logInbox({ messageId, fromEmail, subject, action, contactId, summary }) {
  try {
    await query(
      `INSERT INTO inbox_log (message_id, from_email, subject, action, contact_id)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (message_id) DO NOTHING`,
      [messageId || null, fromEmail, subject, action + (summary ? ` | ${summary}` : ''), contactId || null]
    );
  } catch (e) { console.warn('[Inbox] Log-Fehler:', e.message); }
}

// ── Hauptfunktion ─────────────────────────────────────────────
async function checkInbox() {
  let ImapFlow;
  try { ImapFlow = require('imapflow').ImapFlow; }
  catch { console.warn('[Inbox] imapflow nicht installiert'); return; }

  const client = new ImapFlow({
    host:   process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
    port:   parseInt(process.env.IONOS_IMAP_PORT || '993'),
    secure: true,
    auth:   { user: process.env.IONOS_EMAIL, pass: process.env.IONOS_PASSWORD },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const msgs = [];
      for await (const msg of client.fetch({ unseen: true }, { envelope: true, bodyParts: ['text'] })) {
        msgs.push(msg);
      }
      console.log(`[Inbox] ${msgs.length} ungelesene Nachricht(en)`);

      for (const msg of msgs) {
        const messageId = msg.envelope?.messageId || `uid-${msg.uid}`;
        const subject   = msg.envelope?.subject   || '';
        const fromEmail = msg.envelope?.from?.[0]?.address || '';
        const bodyText  = msg.bodyParts?.get('text')?.toString() || '';

        // Bereits verarbeitet?
        const { rows: existing } = await query(`SELECT id FROM inbox_log WHERE message_id=$1`, [messageId]);
        if (existing.length) continue;

        // KI-Analyse
        const analysis = await analyzeEmail({ subject, body: bodyText, fromEmail });
        console.log(`[Inbox] Mail von ${fromEmail}: action=${analysis.action} (${Math.round((analysis.confidence||0)*100)}%)`);

        let action    = analysis.action || 'sonstiges';
        let contactId = null;

        try {
          if (action === 'angebot_angenommen' && analysis.offer_number) {
            const r = await handleOfferAccepted(analysis.offer_number, fromEmail);
            if (r) { action = `angebot_angenommen:${analysis.offer_number}`; contactId = r.contactId; }
            else     action = `angebot_nicht_gefunden:${analysis.offer_number}`;

          } else if (action === 'rechnung_anfrage') {
            const r = await handleInvoiceRequest(fromEmail, analysis.invoice_number);
            if (r) { action = `rechnung_gesendet:${r.invoiceNumber}`; contactId = r.contactId; }
            else     action = 'rechnung_kein_kontakt';

          } else if (action === 'vertrag_anfrage') {
            const r = await handleContractRequest(fromEmail);
            if (r) { action = `vertrag_gesendet:${r.contractNumber}`; contactId = r.contactId; }
            else     action = 'vertrag_kein_kontakt';

          } else {
            // Kontakt via E-Mail nachschlagen
            const { rows } = await query(`SELECT id FROM contacts WHERE LOWER(email)=LOWER($1) LIMIT 1`, [fromEmail]);
            if (rows.length) contactId = rows[0].id;
          }
        } catch (e) {
          console.error('[Inbox] Aktions-Fehler:', e.message);
          action = `fehler:${e.message.substring(0,80)}`;
        }

        await logInbox({ messageId, fromEmail, subject, action, contactId, summary: analysis.summary });

        try { await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen']); }
        catch (e) { console.warn('[Inbox] Flag-Fehler:', e.message); }
      }
    } finally { lock.release(); }
  } catch (e) {
    console.error('[Inbox] IMAP-Fehler:', e.message);
  } finally {
    try { await client.logout(); } catch {}
  }
}

module.exports = { checkInbox };
