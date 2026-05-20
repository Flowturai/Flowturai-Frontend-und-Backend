import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum – Flowturai",
  description: "Impressum und rechtliche Angaben von Flowturai.",
};

export default function Impressum() {
  return (
    <main className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mb-8 group"
        >
          <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
            <path d="M11.5 7H2.5M6 3.5L2.5 7L6 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Zurück zur Startseite
        </Link>

        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-10">Impressum</h1>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-3">
              Angaben gemäß § 5 TMG
            </h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-1">
              <p className="font-semibold text-slate-800">Jeremy Jung</p>
              <p>Unternehmensbezeichnung: Flowturai</p>
              <p>Efeuweg 37</p>
              <p>22299 Hamburg</p>
              <p>Deutschland</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-3">Kontakt</h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-1">
              <p>
                Telefon:{" "}
                <a href="tel:+4915228352609" className="hover:text-blue-600 transition-colors">
                  +49 152 28352609
                </a>
              </p>
              <p>
                E-Mail:{" "}
                <a href="mailto:info@flowturai.de" className="text-blue-600 hover:underline">
                  info@flowturai.de
                </a>
              </p>
              <p>
                Website:{" "}
                <span className="text-slate-800">flowturai.de</span>
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-3">
              Steuerliche Angaben
            </h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-1">
              <p>
                Steuernummer:{" "}
                <span className="font-medium text-slate-800">[Steuernummer eintragen]</span>
              </p>
              <p>
                Umsatzsteuer: Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen
                (Kleinunternehmerregelung).
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-3">
              Haftungsausschluss
            </h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-3">
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Haftung für Inhalte</h3>
                <p>
                  Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
                  Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
                  als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                  Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
                  rechtswidrige Tätigkeit hinweisen.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Haftung für Links</h3>
                <p>
                  Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir
                  keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
                  Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
                  Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-3">
              Urheberrecht
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
              Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/datenschutz" className="text-xs text-blue-600 hover:underline">Datenschutzerklärung</Link>
            <Link href="/agb" className="text-xs text-blue-600 hover:underline">AGB</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
