import Link from "next/link";

const footerLinks = {
  Leistungen: [
    { label: "KI-Strategie & Beratung", href: "#leistungen" },
    { label: "KI-Implementierung",      href: "#leistungen" },
    { label: "Prozessautomatisierung",  href: "#leistungen" },
    { label: "Datenanalyse",            href: "#leistungen" },
  ],
  Unternehmen: [
    { label: "Über uns", href: "#ueber-uns" },
    { label: "Team",     href: "#ueber-uns" },
    { label: "Preise",   href: "#preise" },
    { label: "Kontakt",  href: "#kontakt" },
  ],
  Rechtliches: [
    { label: "Impressum",   href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "AGB",         href: "/agb" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container-wide py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563EB" }}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <path d="M3 10L8 5L13 10L18 5"  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 15L8 10L13 15L18 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5"/>
                </svg>
              </div>
              <span className="font-heading font-semibold text-lg text-white tracking-tight">Flowturai</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              KI-Beratung und Automatisierungsl&ouml;sungen f&uuml;r kleine und mittelst&auml;ndische Unternehmen in Deutschland.
            </p>
            <a href="mailto:info@flowturai.de" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "#c6e2ff" }}>
              info@flowturai.de
            </a>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors duration-200">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Flowturai. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-5">
            <Link href="/impressum" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Datenschutz</Link>
            <span className="text-xs text-slate-600">&#127465;&#127466; Made in Germany</span>
            <a href="/admin" className="text-slate-900 hover:text-slate-800 transition-colors text-xs select-none" tabIndex={-1} aria-hidden="true">&bull;</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
