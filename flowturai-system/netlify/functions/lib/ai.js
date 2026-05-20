const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du bist der professionelle, freundliche Assistent von Flowturai.
Flowturai ist ein lokaler KI-Automatisierungsberater für kleine Betriebe und Handwerker in Deutschland.
Inhaber: Jeremy Jung. Ton: persönlich, direkt, auf Augenhöhe – nicht wie eine Großagentur.
Schreibe immer auf Deutsch. Keine blumige Sprache, keine Floskeln. Konkret und menschlich.`;

const PROMPTS = {
  confirmation: (c) => `
Schreibe eine kurze Bestätigungs-E-Mail für eine neue Anfrage auf der Website.
Kunde: ${c.name}${c.company ? `, Betrieb: ${c.company}` : ''}${c.industry ? `, Branche: ${c.industry}` : ''}.
${c.message ? `Ihre Nachricht: "${c.message}"` : ''}

Regeln:
- Beginne mit "Hallo ${c.name},"
- Maximal 4 Sätze
- Freue dich auf das Gespräch
- Sage dass du dich innerhalb von 24 Stunden meldest
- Unterschreibe als "Jeremy von Flowturai"
- Kein Betreff, nur den E-Mail-Text`,

  followup_stufe1: (c) => `
Schreibe eine Follow-up-E-Mail nach einem kostenlosen Erstgespräch.
Kunde: ${c.name}${c.company ? `, Betrieb: ${c.company}` : ''}.
Notizen aus dem Gespräch: ${c.notes || 'keine gespeichert'}

Schlage die Vor-Ort-Analyse vor (490–690 €):
- Du kommst vorbei, schaust dir echte Abläufe an
- Lieferst am Ende einen schriftlichen Bericht mit konkreten Verbesserungen
- Auch wenn danach nichts gekauft wird: der Kunde hat echten Mehrwert

Regeln:
- Beginne mit "Hallo ${c.name},"
- Maximal 6 Sätze
- Kein Druck, aber klares Angebot
- Unterschreibe als "Jeremy von Flowturai"`,

  confirmation_analyse: (c) => `
Kurze Bestätigungs-E-Mail für eine gebuchte Vor-Ort-Analyse.
Kunde: ${c.name}, Betrieb: ${c.company || 'nicht angegeben'}.
Bitte nach Adresse und bevorzugtem Termin fragen.
Maximal 4 Sätze. "Hallo ${c.name}," als Anrede. Unterschrift: "Jeremy von Flowturai"`,

  project_start: (c) => `
E-Mail zum Start eines Implementierungsprojekts.
Kunde: ${c.name}, Betrieb: ${c.company || 'nicht angegeben'}.
Kurz erklären was jetzt passiert: du startest mit der Umsetzung, wirst dich regelmäßig melden,
bei Fragen ist Jeremy jederzeit erreichbar.
4 Sätze max. "Hallo ${c.name}," als Anrede. Unterschrift: "Jeremy von Flowturai"`,

  subscription_welcome: (c) => `
Willkommens-E-Mail für das neue Betreuungs-Abo.
Kunde: ${c.name}, Betrieb: ${c.company || 'nicht angegeben'}.
Erkläre kurz was das Abo beinhaltet: Wartung, kleine Anpassungen, Updates, Jeremy als Ansprechpartner.
Die monatliche Rechnung kommt automatisch per E-Mail.
4 Sätze max. "Hallo ${c.name}," als Anrede. Unterschrift: "Jeremy von Flowturai"`,

  invoice_sent: (c, amount) => `
Kurze freundliche E-Mail zur Rechnung.
Kunde: ${c.name}. Betrag: ${amount} €.
Sag dass die Rechnung im Anhang ist und bitte um Zahlung innerhalb von 14 Tagen.
3 Sätze max. "Hallo ${c.name}," als Anrede. Unterschrift: "Jeremy von Flowturai"`,
};

async function generateEmail({ type, contact, amount }) {
  const promptFn = PROMPTS[type];
  if (!promptFn) throw new Error(`Unbekannter E-Mail-Typ: ${type}`);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: promptFn(contact, amount) }]
  });

  return message.content[0].text.trim();
}

module.exports = { generateEmail };
