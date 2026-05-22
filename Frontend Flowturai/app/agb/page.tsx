import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description:
    "Allgemeine Geschäftsbedingungen (AGB) der Flowturai – Leistungen, Zahlungsbedingungen und Haftung.",
  alternates: { canonical: "/agb" },
  openGraph: {
    title: "AGB | Flowturai",
    description:
      "Allgemeine Geschäftsbedingungen (AGB) der Flowturai – Leistungen, Zahlungsbedingungen und Haftung.",
    url: "/agb",
  },
};

export default function AGB() {
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

        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>
        <p className="text-sm text-slate-400 mb-10">Flowturai – Jeremy Jung, Efeuweg 37, 22299 Hamburg</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm text-slate-600 leading-relaxed">

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 1 Geltungsbereich</h2>
            <p className="mb-2">(1) Diese AGB gelten für alle Leistungen von Jeremy Jung, Efeuweg 37, 22299 Hamburg (nachfolgend &quot;Flowturai&quot; oder &quot;Auftragnehmer&quot;) gegenüber Unternehmern im Sinne des § 14 BGB (nachfolgend &quot;Auftraggeber&quot; oder &quot;Kunde&quot;).</p>
            <p className="mb-2">(2) Entgegenstehende oder abweichende Bedingungen des Kunden haben keine Gültigkeit, es sei denn, Flowturai stimmt ihrer Anwendung ausdrücklich schriftlich zu.</p>
            <p>(3) Diese AGB gelten auch für zukünftige Geschäfte mit dem Kunden, ohne dass es eines erneuten Hinweises bedarf.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 2 Leistungsbeschreibung</h2>
            <p className="mb-2">(1) Flowturai erbringt folgende Hauptleistungen:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Erstgespräch (kostenlos, ca. 30–60 Min.): Analyse des Betriebs und Identifikation von Automatisierungspotenzialen</li>
              <li>Vor-Ort-Analyse (kostenpflichtig): Tiefgehende Analyse der Betriebsabläufe, Prozesse und IT-Infrastruktur mit schriftlichem Analysebericht</li>
              <li>Implementierung (kostenpflichtig): Entwicklung und Integration KI-gestützter Lösungen, Automatisierungen und digitaler Workflows</li>
              <li>Betreuungs-Abo (monatlich kündbar): Laufende Betreuung, Wartung und Optimierung der implementierten Lösungen</li>
            </ul>
            <p className="mb-2">(2) Der genaue Leistungsumfang wird im jeweiligen Angebot bzw. Vertrag schriftlich festgehalten. Mündliche Nebenabreden bedürfen der Schriftform.</p>
            <p>(3) Flowturai schuldet eine fachgerechte Leistungserbringung nach aktuellem Stand der Technik, keinen bestimmten wirtschaftlichen Erfolg (Werkleistung nur soweit ausdrücklich vereinbart, ansonsten Dienstleistung).</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 3 Vertragsschluss</h2>
            <p className="mb-2">(1) Angebote von Flowturai sind freibleibend und unverbindlich, sofern sie nicht ausdrücklich als bindend bezeichnet sind.</p>
            <p className="mb-2">(2) Ein Vertrag kommt zustande durch: schriftliche Auftragsbestätigung von Flowturai, Unterzeichnung eines Vertrages durch beide Parteien, oder konkludente Leistungsaufnahme nach Angebotsannahme durch den Kunden.</p>
            <p>(3) Änderungen und Ergänzungen zum Vertrag bedürfen der Schriftform (E-Mail genügt).</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 4 Preise und Zahlung</h2>
            <p className="mb-2">(1) Es gelten die im Angebot oder Vertrag ausgewiesenen Preise. Alle Preise sind Nettopreise. Flowturai ist Kleinunternehmer gemäß § 19 UStG – es wird keine Umsatzsteuer berechnet.</p>
            <p className="mb-2">(2) Rechnungen sind innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug zur Zahlung fällig, sofern nichts anderes vereinbart wurde.</p>
            <p className="mb-2">(3) Bei Zahlungsverzug ist Flowturai berechtigt, Verzugszinsen in Höhe von 8 Prozentpunkten über dem Basiszinssatz gemäß § 288 Abs. 2 BGB zu berechnen.</p>
            <p className="mb-2">(4) Beim Betreuungs-Abo erfolgt die Abrechnung monatlich im Voraus. Die erste Rechnung wird nach Vertragsschluss gestellt.</p>
            <p>(5) Aufrechnung ist nur mit unbestrittenen oder rechtskräftig festgestellten Forderungen zulässig.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 5 Mitwirkungspflichten des Kunden</h2>
            <p className="mb-2">(1) Der Kunde verpflichtet sich zur notwendigen Mitwirkung, insbesondere:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Bereitstellung von Zugangsdaten, Informationen und Unterlagen in erforderlichem Umfang und rechtzeitig</li>
              <li>Benennung eines kompetenten Ansprechpartners</li>
              <li>Freigabe von Arbeitsergebnissen innerhalb vereinbarter Fristen</li>
              <li>Sicherung eigener Daten vor Beginn von Integrationsarbeiten</li>
            </ul>
            <p>(2) Verzögert sich die Leistungserbringung durch Flowturai aufgrund mangelnder Mitwirkung des Kunden, verlängern sich vereinbarte Fristen entsprechend. Mehraufwand wird nach Aufwand vergütet.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 6 Geheimhaltung und Datenschutz</h2>
            <p className="mb-2">(1) Beide Parteien verpflichten sich, vertrauliche Informationen der jeweils anderen Partei nicht an Dritte weiterzugeben und nur für den Zweck der Vertragserfüllung zu nutzen.</p>
            <p className="mb-2">(2) Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung von Flowturai und den einschlägigen datenschutzrechtlichen Bestimmungen (DSGVO, BDSG).</p>
            <p>(3) Soweit Flowturai im Auftrag des Kunden personenbezogene Daten verarbeitet, wird ein gesonderter Auftragsverarbeitungsvertrag (AV-Vertrag) geschlossen.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 7 Nutzungsrechte und geistiges Eigentum</h2>
            <p className="mb-2">(1) An den für den Kunden erstellten Arbeitsergebnissen (Dokumentationen, Konfigurationen, Skripte, Konzepte) räumt Flowturai dem Kunden nach vollständiger Bezahlung ein einfaches, nicht übertragbares Nutzungsrecht ein.</p>
            <p className="mb-2">(2) Von Flowturai eingesetzte Werkzeuge, Methoden und Know-how bleiben Eigentum von Flowturai und werden nicht übertragen.</p>
            <p>(3) Der Kunde darf Arbeitsergebnisse ohne ausdrückliche Zustimmung nicht an Dritte weitergeben oder kommerziell verwerten.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 8 Haftung</h2>
            <p className="mb-2">(1) Flowturai haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.</p>
            <p className="mb-2">(2) Bei leichter Fahrlässigkeit haftet Flowturai nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), begrenzt auf den vorhersehbaren, vertragstypischen Schaden. Die Haftung ist auf den Nettowert der jeweiligen Auftragsleistung begrenzt.</p>
            <p className="mb-2">(3) Flowturai haftet nicht für Schäden, die entstehen durch:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Unzureichende Mitwirkung des Kunden</li>
              <li>Fehlerhaften oder unvollständigen Informationen des Kunden</li>
              <li>Eingriffe des Kunden oder Dritter in erbrachte Leistungen</li>
              <li>Höhere Gewalt oder unvorhersehbare technische Störungen</li>
            </ul>
            <p>(4) Die vorstehenden Haftungsbeschränkungen gelten auch für die persönliche Haftung von Mitarbeitern, Vertretern und Erfüllungsgehilfen.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 9 Kündigung (Betreuungs-Abo)</h2>
            <p className="mb-2">(1) Das Betreuungs-Abo wird auf unbestimmte Zeit geschlossen und ist von beiden Parteien mit einer Frist von 30 Tagen zum Monatsende kündbar.</p>
            <p className="mb-2">(2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt insbesondere vor, wenn der Kunde mit zwei Monatszahlungen in Verzug ist.</p>
            <p className="mb-2">(3) Kündigungen bedürfen der Schriftform (E-Mail an{" "}
              <a href="mailto:info@flowturai.de" className="text-blue-600 hover:underline">info@flowturai.de</a>{" "}
              genügt).
            </p>
            <p>(4) Bei Kündigung werden bereits erbrachte Leistungen anteilig abgerechnet. Im Voraus bezahlte Beträge für nicht mehr erbrachte Leistungen werden erstattet.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 10 Widerrufsrecht</h2>
            <p>(1) Diese AGB richten sich ausschließlich an Unternehmer (§ 14 BGB). Ein Widerrufsrecht gemäß §§ 312 ff. BGB besteht für Verbraucher (§ 13 BGB). Sollte ausnahmsweise ein Verbraucher Vertragspartner sein, gelten die gesetzlichen Widerrufsregelungen.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">§ 11 Schlussbestimmungen</h2>
            <p className="mb-2">(1) Es gilt ausschließlich deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG).</p>
            <p className="mb-2">(2) Erfüllungsort und ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist Hamburg, sofern der Kunde Vollkaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.</p>
            <p className="mb-2">(3) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Anstelle der unwirksamen Bestimmung gilt die gesetzliche Regelung.</p>
            <p>(4) Nebenabreden, Änderungen und Ergänzungen dieser AGB bedürfen der Schriftform. Dies gilt auch für die Aufhebung des Schriftformerfordernisses.</p>
          </section>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-slate-400">Stand: Mai 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
