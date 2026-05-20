const { supabase }           = require('./lib/supabase');
const { generateInvoicePDF } = require('./lib/pdf');
const { generateEmail }      = require('./lib/ai');
const { sendEmail }          = require('./lib/email');

const HEADERS = { 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (event.headers['x-admin-key'] !== process.env.ADMIN_SECRET_KEY) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Nicht autorisiert' }) };
  }

  try {
    const {
      contactId,
      amount,
      description,
      dueInDays  = 14,
      projectId  = null,
    } = JSON.parse(event.body || '{}');

    if (!contactId || !amount || !description) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'contactId, amount und description erforderlich' }) };
    }

    // Kontakt laden
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contact) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Kontakt nicht gefunden' }) };
    }

    // Nächste Rechnungsnummer
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const year          = new Date().getFullYear();
    const invoiceNumber = `FT-${year}-${String((count || 0) + 1).padStart(3, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueInDays);

    // Rechnung in DB anlegen
    const { data: invoice, error: insertErr } = await supabase
      .from('invoices')
      .insert({
        contact_id:     contactId,
        project_id:     projectId,
        invoice_number: invoiceNumber,
        amount:         parseFloat(amount),
        description,
        due_date:       dueDate.toISOString().split('T')[0],
        status:         'sent',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // PDF generieren
    const pdfBuffer = await generateInvoicePDF({ invoice, contact });

    // E-Mail-Text via KI
    const emailBody = await generateEmail({ type: 'invoice_sent', contact, amount });

    // Rechnung verschicken
    await sendEmail({
      to:      contact.email,
      subject: `Rechnung ${invoiceNumber} von Flowturai`,
      body:    emailBody,
      attachments: [{
        filename:     `Rechnung-${invoiceNumber}.pdf`,
        content:      pdfBuffer.toString('base64'),
        content_type: 'application/pdf',
      }],
    });

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ success: true, invoiceNumber }),
    };
  } catch (err) {
    console.error('[send-invoice]', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Fehler beim Erstellen der Rechnung' }),
    };
  }
};
