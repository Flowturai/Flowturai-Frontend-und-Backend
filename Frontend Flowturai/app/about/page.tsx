import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Flowturai – gegründet von Jeremy Jung. KI-Beratung und Automatisierung für KMU in Deutschland. Praxisnah, schnell und messbar.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Über uns | Flowturai",
    description:
      "Flowturai – gegründet von Jeremy Jung. KI-Beratung und Automatisierung für KMU in Deutschland.",
    url: "/about",
  },
};

export default function About() {
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

        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-4">Über Flowturai</h1>
        <p className="text-slate-500 text-base leading-relaxed mb-12">
          Flowturai ist eine KI-Agentur für kleine und mittelständische Unternehmen in Deutschland. Wir helfen Unternehmen dabei, KI-Lösungen praxisnah und ohne unnötige Komplexität einzuführen.
        </p>

        {/* Gründer */}
        <section className="mb-14">
          <h2 className="font-heading text-xl font-semibold text-slate-900 mb-6">Der Gründer</h2>
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Foto */}
            <img
              src="/jeremy.jpg"
              alt="Jeremy Jung, Gründer Flowturai"
              width={128}
              height={128}
              className="w-32 h-32 rounded-2xl object-cover object-top border border-slate-200 shrink-0"
            />
            <div className="flex-1">
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">Jeremy Jung</h3>
              <p className="text-blue-600 text-sm font-medium mb-4">Gründer &amp; CEO, Flowturai</p>
              <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                <p>
                  Jeremy ist ein Hamburger Unternehmer, der sich auf KI-Integration und Automatisierung für den deutschen Mittelstand spezialisiert.
                </p>
                <p>
                  Mit praktischer Erfahrung in der Umsetzung von KI-Workflows, internen Tools und Automatisierungslösungen hilft er mittelständischen Unternehmen, operative Prozesse smarter zu gestalten – ohne unnötige Komplexität.
                </p>
                <p>
                  Sein Ansatz: pragmatisch, technisch fundiert und nah an der Praxis.
                </p>
              </div>
              <div className="mt-5 flex gap-3">
                <a
                  href="https://linkedin.com/in/jeremy-jung"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"/>
                  </svg>
                  LinkedIn Profil
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-14">
          <h2 className="font-heading text-xl font-semibold text-slate-900 mb-6">Unsere Mission</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: "Warum",
                text: "KI-Projekte scheitern oft an zu viel Komplexität. Wir machen es einfach, schnell und messbar.",
              },
              {
                title: "Wie",
                text: "Praxisnahe Beratung, schnelle Umsetzung und enge Zusammenarbeit — ohne Overhead.",
              },
              {
                title: "Für wen",
                text: "Kleine und mittelständische Unternehmen in Deutschland, die KI konkret einsetzen wollen.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-heading font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="font-heading text-xl font-bold mb-3">Bereit für ein Gespräch?</h2>
          <p className="text-blue-100 text-sm mb-6">30 Minuten kostenlos, unverbindlich — und konkret.</p>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-full text-sm hover:bg-blue-50 transition-colors"
          >
            Erstgespräch anfragen →
          </Link>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-200 flex flex-wrap gap-4">
          <Link href="/impressum" className="text-xs text-blue-600 hover:underline">Impressum</Link>
          <Link href="/datenschutz" className="text-xs text-blue-600 hover:underline">Datenschutzerklärung</Link>
          <Link href="/agb" className="text-xs text-blue-600 hover:underline">AGB</Link>
        </div>
      </div>
    </main>
  );
}
