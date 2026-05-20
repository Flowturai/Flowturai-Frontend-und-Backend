const { supabase }      = require('./lib/supabase');
const { generateEmail } = require('./lib/ai');
const { sendEmail }     = require('./lib/email');

const HEADERS = { 'Content-Type': 'application/json' };

const STAGE_CONFIG = {
  stufe1:       { subject: 'Nächste Schritte mit Flowturai',            emailType: 'followup_stufe1' },
  stufe2:       { subject: 'Ihre Vor-Ort-Analyse ist bestätigt',        emailType: 'confirmation_analyse' },
  stufe3:       { subject: 'Ihr Implementierungsprojekt startet',       emailType: 'project_start' },
  stufe4:       { subject: 'Willkommen im Betreuungs-Abo',              emailType: 'subscription_welcome' },
  abgeschlossen:{ subject: null, emailType: null },
  verloren:     { subject: null, emailType: null },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Admin-Auth
  if (event.headers['x-admin-key'] !== process.env.ADMIN_SECRET_KEY) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Nicht autorisiert' }) };
  }

  try {
    const {
      contactId,
      newStage,
      sendNotification = true,
      note,
    } = JSON.parse(event.body || '{}');

    if (!contactId || !newStage) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'contactId und newStage erforderlich' }) };
    }

    // Kontakt laden
    const { data: contact, error: fetchErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (fetchErr || !contact) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Kontakt nicht gefunden' }) };
    }

    // Notiz anhängen (optional)
    const updatedNotes = note
      ? `${contact.notes ? contact.notes + '\n' : ''}[${new Date().toLocaleDateString('de-DE')}] ${note}`
      : contact.notes;

    // Status aktualisieren
    const { error: updateErr } = await supabase
      .from('contacts')
      .update({ status: newStage, notes: updatedNotes })
      .eq('id', contactId);

    if (updateErr) throw updateErr;

    // E-Mail senden (falls gewünscht und konfiguriert)
    const config = STAGE_CONFIG[newStage];
    if (sendNotification && config?.emailType) {
      const body = await generateEmail({ type: config.emailType, contact: { ...contact, notes: updatedNotes } });
      await sendEmail({ to: contact.email, subject: config.subject, body });
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ success: true, message: `${contact.name} → ${newStage}` }),
    };
  } catch (err) {
    console.error('[update-stage]', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Fehler beim Aktualisieren des Status' }),
    };
  }
};
