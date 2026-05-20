const { supabase }      = require('./lib/supabase');
const { generateEmail } = require('./lib/ai');
const { sendEmail }     = require('./lib/email');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { name, email, phone, company, industry, message } = JSON.parse(event.body || '{}');

    if (!name?.trim() || !email?.trim()) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Name und E-Mail sind erforderlich.' }),
      };
    }

    // 1. Kontakt in Datenbank anlegen
    const { data: contact, error: dbError } = await supabase
      .from('contacts')
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), phone, company, industry, message, status: 'lead' })
      .select()
      .single();

    if (dbError) {
      // Doppelte E-Mail abfangen
      if (dbError.code === '23505') {
        return {
          statusCode: 409,
          headers: CORS,
          body: JSON.stringify({ error: 'Diese E-Mail-Adresse ist bereits registriert.' }),
        };
      }
      throw dbError;
    }

    // 2. KI-Bestätigungsmail generieren
    const emailBody = await generateEmail({ type: 'confirmation', contact });

    // 3. Bestätigung an Kunden
    await sendEmail({
      to: contact.email,
      subject: 'Ihre Anfrage bei Flowturai – wir melden uns bald!',
      body: emailBody,
    });

    // 4. Interne Benachrichtigung an Jeremy
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'jungjeremy28@gmail.com',
      subject: `📥 Neue Anfrage: ${contact.name}${contact.company ? ` (${contact.company})` : ''}`,
      body: [
        `Neue Website-Anfrage eingegangen!`,
        ``,
        `Name:      ${contact.name}`,
        `E-Mail:    ${contact.email}`,
        `Telefon:   ${contact.phone || '—'}`,
        `Betrieb:   ${contact.company || '—'}`,
        `Branche:   ${contact.industry || '—'}`,
        ``,
        `Nachricht:`,
        contact.message || '(keine)',
        ``,
        `→ Im Dashboard ansehen: https://${process.env.ADMIN_DOMAIN || 'deine-domain.netlify.app'}/`,
      ].join('\n'),
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, message: 'Anfrage erhalten! Wir melden uns innerhalb von 24 Stunden.' }),
    };
  } catch (err) {
    console.error('[book-consultation]', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' }),
    };
  }
};
