"use client";
import { motion } from "framer-motion";

const services = [
  {
    title: "KI-Strategie & Beratung",
    description: "Wir analysieren Ihre bestehenden Prozesse und entwickeln eine maßgeschneiderte KI-Roadmap – realistisch, umsetzbar und auf Ihr Budget abgestimmt.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      </svg>
    ),
    color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100",
  },
  {
    title: "KI-Implementierung",
    description: "Von der Proof of Concept bis zur produktionsreifen Lösung – wir setzen KI-Systeme direkt in Ihrem Unternehmen um. Keine Black Box, nur echte Ergebnisse.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4M7 8l3 3-3 3M13 14h4" />
      </svg>
    ),
    color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100",
  },
  {
    title: "Prozessautomatisierung",
    description: "Repetitive Aufgaben automatisieren, Fehler minimieren und Ihre Mitarbeiter für wertschöpfende Tätigkeiten freistellen – messbar und nachhaltig.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100",
  },
  {
    title: "Datenanalyse & Insights",
    description: "Wir verwandeln Ihre Rohdaten in verwertbare Erkenntnisse. KI-gestützte Analysen, die fundierte Entscheidungen ermöglichen und Potenziale sichtbar machen.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M18 20V10M12 20V4M6 20v-6M2 20h20" />
      </svg>
    ),
    color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100",
  },
  {
    title: "Support & Wartung",
    description: "Langfristige Betreuung Ihrer KI-Systeme: Monitoring, Updates, Fehlerbehebung und kontinuierliche Optimierung – damit Ihre Lösungen dauerhaft performen.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
      </svg>
    ),
    color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100",
  },
  {
    title: "Webentwicklung & Apps",
    description: "Moderne, schnelle Websites und Web-Apps – KI-gestützt entwickelt, mit Festpreis und klaren Timelines. Von der Landing Page bis zur komplexen Plattform.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
      </svg>
    ),
    color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100",
  },
];

export default function ServicesSection() {
  return (
    <section id="leistungen" className="section-padding" style={{ backgroundColor: "#F0F8FF" }}>
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="section-label justify-center w-fit mx-auto">
            Unsere Leistungen
          </motion.div>
          <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, delay:0.1 }} className="section-title mb-4">
            Alles aus einer Hand – von der Strategie bis zum Betrieb
          </motion.h2>
          <motion.p initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, delay:0.2 }} className="section-subtitle">
            Wir begleiten Sie durch den gesamten KI-Transformationsprozess – praxisnah, ohne unnötigen Overhead.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-60px" }} transition={{ duration:0.5, delay:i*0.07 }}
              className="group bg-white rounded-2xl border border-[#DBEAFE] p-6 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50/80 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4 ${s.color} group-hover:scale-110 transition-transform duration-300`}>
                {s.icon}
              </div>
              <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
