const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Du bist der professionelle Assistent von Flowturai, einem lokalen KI-Berater für Handwerk und Kleinbetriebe in Deutschland.
Ton: persönlich, direkt, professionell. Auf Augenhöhe – nicht wie eine Großagentur.
Sprache: Deutsch. Keine Floskeln. Konkret und menschlich.
Verabschiedung IMMER: "Dein Flowturai Team"
Unterschreibe NIE mit einem Personennamen.`;

/**
 * DSGVO-Hinweis: Diese Funktion erhält NUR anonymisierte Kontextdaten.
 * Keine Namen, E-Mails oder Telefonnummern werden an die Claude API gesendet.
 * Persönliche Daten (name, email) werden lokal eingesetzt NACHDEM die KI geantwortet hat.
 */

// ── Anrede lokal ableiten (geht NICHT zur API) ──────────────
function buildAnrede(contact) {
  if (contact.company && contact.company.trim()) {
    return `Liebes ${contact.company.trim()} Team`;
  }
  // Kein Firmenname → geschlechtsneutral
  return 'Guten Tag';
}

const TEMPLATES = {
  confirmation: ({ anrede, branche, problem }) => `
Schreibe eine kurze Bestätigungs-E-Mail für eine neue Website-Anfrage.
Kontext (anonymisiert): Betrieb aus der Branche "${branche || 'Handwerk'}"${problem ? `, Thema: "${problem}"` : ''}.

Regeln:
- Beginne mit "${anrede},"
- Max. 4 Sätze
- Wir melden uns innerhalb von 24 Stunden
- Freude auf das Gespräch ausdrücken
- Ende mit: "Dein Flowturai Team"`,

  followup_stufe1: ({ anrede, branche, notiz }) => `
Schreibe eine Follow-up-E-Mail nach einem kostenlosen Erstgespräch.
Kontext: Betrieb aus "${branche || 'Handwerk'}"${notiz ? `. Gesprächsnotiz: "${notiz}"` : ''}.

Schlage höflich die Vor-Ort-Analyse vor (490–690 €):
- Wir kommen vorbei, analysieren echte Abläufe
- Schriftlicher Bericht mit konkreten Verbesserungen
- Auch ohne Folgeauftrag hat der Kunde echten Mehrwert

Regeln:
- Beginne mit "${anrede},"
- Max. 6 Sätze, kein Verkaufsdruck
- Ende mit: "Dein Flowturai Team"`,

  confirmation_analyse: ({ anrede }) => `
Kurze Bestätigungs-E-Mail für eine gebuchte Vor-Ort-Analyse.
Bitte um Adresse und bevorzugten Termin.
Beginne mit "${anrede},". Max. 4 Sätze. Ende mit "Dein Flowturai Team".`,

  project_start: ({ anrede, branche }) => `
E-Mail zum Start eines Implementierungsprojekts.
Kontext: Betrieb aus "${branche || 'Handwerk'}".
Erkläre: wir starten mit der Umsetzung, melden uns regelmäßig, sind jederzeit erreichbar.
Beginne mit "${anrede},". Max. 4 Sätze. Ende mit "Dein Flowturai Team".`,

  subscription_welcome: ({ anrede }) => `
Willkommens-E-Mail für neues Betreuungs-Abo.
Erkläre kurz: Wartung, kleine Anpassungen, Updates, persönlicher Ansprechpartner.
Monatliche Rechnung kommt automatisch per E-Mail.
Beginne mit "${anrede},". Max. 4 Sätze. Ende mit "Dein Flowturai Team".`,

  invoice_sent: ({ anrede }) => `
Kurze E-Mail zur beigefügten Rechnung. Betrag NICHT nennen.
Anbei befindet sich die Rechnung als PDF-Dokument. Zahlungsziel 14 Tage. Wir sind bei Rückfragen jederzeit erreichbar.
Beginne mit "${anrede},". Max. 3 Sätze. Ende mit "Dein Flowturai Team".`,

  offer_sent: ({ anrede }) => `
Kurze E-Mail zum beigefügten Angebot. Betrag NICHT nennen.
Anbei befindet sich das gewünschte Angebot als PDF-Dokument. Das Angebot ist 30 Tage gültig.
Lade freundlich ein, sich bei Rückfragen zu melden oder das Angebot anzunehmen.
Beginne mit "${anrede},". Max. 3 Sätze. Ende mit "Dein Flowturai Team".`,

  dunning_1: ({ anrede, rechnungsnummer, betrag }) => `
Schreibe eine höfliche erste Zahlungserinnerung.
Rechnungsnummer: ${rechnungsnummer}, offener Betrag: ${betrag} €.
Freundlicher Ton – es könnte sich um ein Versehen handeln.
Bitte um Überweisung innerhalb von 7 Tagen oder Rückmeldung bei Rückfragen.
Beginne mit "${anrede},". Max. 4 Sätze. Ende mit "Dein Flowturai Team".`,

  dunning_2: ({ anrede, rechnungsnummer, betrag, gebuehr }) => `
Schreibe eine zweite, deutlichere Mahnung.
Rechnungsnummer: ${rechnungsnummer}, offener Betrag: ${betrag} €${gebuehr ? ` zzgl. Mahngebühr ${gebuehr} €` : ''}.
Erkläre, dass rechtliche Schritte folgen könnten wenn nicht innerhalb von 7 Tagen bezahlt wird.
Ton: bestimmt aber professionell.
Beginne mit "${anrede},". Max. 5 Sätze. Ende mit "Dein Flowturai Team".`,
};

// ── Fallback-Texte (wenn API nicht erreichbar) ──────────────
const FALLBACK_TEMPLATES = {
  confirmation:       (a) => `${a},\n\nvielen Dank für Ihre Anfrage! Wir haben Ihre Nachricht erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.\n\nWir freuen uns auf das Gespräch!\n\nDein Flowturai Team`,
  followup_stufe1:    (a) => `${a},\n\nvielen Dank für unser Gespräch! Wir würden gerne im nächsten Schritt eine Vor-Ort-Analyse durchführen, um konkrete Verbesserungspotenziale für Ihren Betrieb zu identifizieren.\n\nMelden Sie sich gerne, wenn Sie Fragen haben.\n\nDein Flowturai Team`,
  confirmation_analyse:(a) => `${a},\n\ndanke für die Buchung der Vor-Ort-Analyse! Bitte teilen Sie uns Ihre Adresse und einen bevorzugten Termin mit.\n\nDein Flowturai Team`,
  project_start:      (a) => `${a},\n\nwir starten jetzt mit der Umsetzung Ihres Projekts! Wir melden uns regelmäßig mit Updates und sind jederzeit für Ihre Fragen da.\n\nDein Flowturai Team`,
  subscription_welcome:(a) => `${a},\n\nwillkommen im Betreuungs-Abo! Wir kümmern uns um Updates, Wartung und Optimierungen. Die monatliche Rechnung kommt automatisch per E-Mail.\n\nDein Flowturai Team`,
  invoice_sent:       (a) => `${a},\n\nanbei erhalten Sie Ihre Rechnung als PDF-Dokument. Das Zahlungsziel beträgt 14 Tage. Bei Fragen sind wir jederzeit für Sie erreichbar.\n\nDein Flowturai Team`,
  offer_sent:         (a) => `${a},\n\nanbei finden Sie das gewünschte Angebot als PDF-Dokument. Das Angebot ist 30 Tage gültig. Bei Rückfragen melden Sie sich gerne jederzeit.\n\nDein Flowturai Team`,
  dunning_1:          (a, r, b) => `${a},\n\nwir möchten Sie freundlich daran erinnern, dass Rechnung ${r} über ${b} € noch offen ist. Bitte überweisen Sie den Betrag innerhalb von 7 Tagen oder melden Sie sich bei uns.\n\nDein Flowturai Team`,
  dunning_2:          (a, r, b) => `${a},\n\nhiermit mahnen wir erneut die offene Rechnung ${r} über ${b} €. Bitte begleichen Sie den Betrag innerhalb von 7 Tagen, da sonst rechtliche Schritte folgen. Bei Rückfragen melden Sie sich.\n\nDein Flowturai Team`,
};

/**
 * Generiert eine E-Mail via Claude.
 * @param {string} type - Template-Typ
 * @param {Object} contact - Vollständiges Kontaktobjekt (persönliche Daten NICHT an API)
 * @param {Object} extras - Zusätzliche anonymisierte Infos (betrag, etc.)
 */
async function generateEmail(type, contact, extras = {}) {
  const template = TEMPLATES[type];
  if (!template) throw new Error(`Unbekannter E-Mail-Typ: ${type}`);

  // Anrede lokal ableiten – geht NICHT zur API (DSGVO)
  const anrede = buildAnrede(contact);

  // Nur anonymisierte Daten an Claude senden
  const anonymizedCtx = {
    anrede,
    branche:         contact.industry || '',
    notiz:           contact.notes   ? contact.notes.substring(0, 100) : '',
    problem:         contact.message ? contact.message.substring(0, 80) : '',
    betrag:          extras.betrag          || '',
    rechnungsnummer: extras.rechnungsnummer || '',
    mahnstufe:       extras.mahnstufe       || '',
    gebuehr:         extras.gebuehr         || '',
  };

  const prompt = template(anonymizedCtx);

  try {
    const msg = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system:     SYSTEM,
      messages:   [{ role: 'user', content: prompt }],
    });
    return msg.content[0].text.trim();
  } catch (apiErr) {
    console.warn(`[AI] API-Fehler (${type}), nutze Fallback:`, apiErr.message);
    const fb = FALLBACK_TEMPLATES[type];
    if (fb) return fb(anrede, extras.rechnungsnummer, extras.betrag, extras.gebuehr);
    return `${anrede},\n\nvielen Dank für Ihre Nachricht.\n\nDein Flowturai Team`;
  }
}

module.exports = { generateEmail };
