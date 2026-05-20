import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Flowturai",
  description: "Datenschutzerklärung von Flowturai gemäß DSGVO.",
};

export default function Datenschutz() {
  return (
    <main className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mb-8"
        >
          <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
            <path d="M11.5 7H2.5M6 3.5L2.5 7L6 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Zurück zur Startseite
        </Link>

        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-slate-400 mb-10">Stand: 15. Mai 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm text-slate-600 leading-relaxed">

          <p>
            Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Diese Datenschutzerklärung
            informiert Sie gemäß Art. 13 und 14 der Datenschutz-Grundverordnung (DSGVO) über die
            Verarbeitung personenbezogener Daten im Zusammenhang mit der Nutzung unserer Website und
            unserer Dienstleistungen.
          </p>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">1. Verantwortlicher</h2>
            <div className="space-y-1">
              <p className="font-medium text-slate-800">Jeremy Jung – Flowturai</p>
              <p>Efeuweg 37, 22299 Hamburg</p>
              <p>E-Mail: <a href="mailto:info@flowturai.de" className="text-blue-600 hover:underline">info@flowturai.de</a></p>
              <p>Telefon: <a href="tel:+4915228352609" className="hover:text-blue-600 transition-colors">+49 152 28352609</a></p>
              <p>Website: flowturai.de</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">
              2. Erhebung und Verarbeitung personenbezogener Daten
            </h2>

            <h3 className="font-semibold text-slate-800 mb-2">2.1 Besuch unserer Website</h3>
            <p className="mb-2">
              Beim Aufrufen unserer Website werden durch den Browser automatisch technisch notwendige
              Daten an den Server übermittelt und temporär gespeichert (Server-Log-Dateien):
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>IP-Adresse (anonymisiert nach 7 Tagen)</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Name und URL der abgerufenen Datei</li>
              <li>Zuvor besuchte Website (Referrer-URL)</li>
              <li>Browser und Betriebssystem</li>
            </ul>
            <p className="mb-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Sicherheit und
              Stabilität des Betriebs).
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">2.2 Kontaktformular und Anfragen</h3>
            <p className="mb-4">
              Wenn Sie über unser Kontaktformular, per E-Mail oder telefonisch Kontakt aufnehmen,
              verarbeiten wir die von Ihnen übermittelten Daten (Name, E-Mail-Adresse, Telefonnummer,
              Betrieb, Nachricht) zur Bearbeitung Ihrer Anfrage und gegebenenfalls für eine
              Vertragsanbahnung. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung),
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">2.3 Kundendaten bei Vertragsabschluss</h3>
            <p className="mb-2">Im Rahmen der Geschäftsbeziehung verarbeiten wir folgende Daten:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Kontaktdaten (Name, Adresse, E-Mail, Telefon)</li>
              <li>Unternehmensdaten (Betrieb, Branche)</li>
              <li>Vertragsdaten (Leistungsbeschreibung, Laufzeit, Preise)</li>
              <li>Rechnungs- und Zahlungsdaten</li>
              <li>Kommunikationsdaten (E-Mail-Verkehr, Protokolle)</li>
            </ul>
            <p>
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), Art. 6 Abs. 1 lit. c
              DSGVO (gesetzliche Aufbewahrungspflichten gemäß HGB, AO).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">
              3. Einsatz externer Dienste
            </h2>

            <h3 className="font-semibold text-slate-800 mb-2">3.1 Hosting – IONOS SE</h3>
            <p className="mb-4">
              Unsere Website wird bei der IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, gehostet.
              E-Mails werden über IONOS-Mailserver verarbeitet. Es besteht ein
              Auftragsverarbeitungsvertrag (AV-Vertrag) gemäß Art. 28 DSGVO.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">3.2 KI-Dienstleistung – Anthropic, PBC</h3>
            <p className="mb-4">
              Für die automatisierte Erstellung und Analyse von Dokumenten sowie zur
              E-Mail-Klassifizierung nutzen wir die Claude API der Anthropic, PBC (San Francisco, USA).
              Dabei werden keine personenbezogenen Kundendaten im Klartext übermittelt. Texte werden
              vor der Übertragung anonymisiert oder aggregiert. Anthropic ist gemäß EU-US Data Privacy
              Framework zertifiziert. Rechtsgrundlage für die Übermittlung in die USA: Art. 46 DSGVO
              i.V.m. Standardvertragsklauseln.
            </p>

            <h3 className="font-semibold text-slate-800 mb-2">3.3 WhatsApp-Benachrichtigungen – Twilio Inc.</h3>
            <p>
              Für interne Benachrichtigungen (ausschließlich an den Betreiber) nutzen wir den Dienst
              Twilio Inc. (375 Beale Street, San Francisco, CA 94105, USA). Es werden keine
              personenbezogenen Daten von Kunden an Twilio übermittelt – lediglich interne
              Statusmeldungen.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">4. Cookies</h2>
            <p>
              Unsere Website verwendet ausschließlich technisch notwendige Cookies (z.B.
              Session-Cookies für das Adminbereich-Login). Es werden keine Marketing- oder
              Tracking-Cookies eingesetzt. Eine Einwilligung ist gemäß § 25 Abs. 2 TTDSG nicht
              erforderlich.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">5. Speicherdauer</h2>
            <p className="mb-2">
              Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck
              erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Rechnungs- und Vertragsdaten: 10 Jahre (§ 257 HGB, § 147 AO)</li>
              <li>Geschäftskorrespondenz: 6 Jahre (§ 257 HGB)</li>
              <li>Server-Logs: 7 Tage, danach anonymisiert</li>
              <li>Daten nach Vertragsende ohne weitere Aufbewahrungspflicht: 30 Tage nach Vertragsende</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">
              6. Ihre Rechte als betroffene Person
            </h2>
            <p className="mb-2">
              Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
            </ul>
            <p>
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
              <a href="mailto:info@flowturai.de" className="text-blue-600 hover:underline">
                info@flowturai.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">
              7. Beschwerderecht bei der Aufsichtsbehörde
            </h2>
            <p className="mb-2">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
              Ihrer personenbezogenen Daten zu beschweren. Zuständig ist:
            </p>
            <div className="space-y-1">
              <p className="font-medium text-slate-800">
                Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit
              </p>
              <p>Ludwig-Erhard-Str. 22, 20459 Hamburg</p>
              <p>E-Mail: <a href="mailto:mailbox@datenschutz.hamburg.de" className="text-blue-600 hover:underline">mailbox@datenschutz.hamburg.de</a></p>
              <p>Website: datenschutz.hamburg.de</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">8. Datensicherheit</h2>
            <p>
              Unsere Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
              Inhalte eine SSL/TLS-Verschlüsselung. Darüber hinaus setzen wir technische und
              organisatorische Maßnahmen (TOM) gemäß Art. 32 DSGVO ein, um Ihre Daten vor
              unberechtigtem Zugriff zu schützen.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">
              9. Aktualität dieser Datenschutzerklärung
            </h2>
            <p>
              Diese Datenschutzerklärung hat den Stand vom 15. Mai 2026. Wir behalten uns vor, sie bei
              Änderungen der Rechtslage oder bei Änderungen unserer Dienste anzupassen. Die jeweils
              aktuelle Fassung ist auf unserer Website abrufbar.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/impressum" className="text-xs text-blue-600 hover:underline">Impressum</Link>
            <Link href="/agb" className="text-xs text-blue-600 hover:underline">AGB</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
