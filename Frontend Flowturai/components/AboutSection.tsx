"use client";
import { motion } from "framer-motion";

const values = [
  { title: "Praxisnah statt theoretisch",    description: "Keine Buzzwords – nur Lösungen, die bei Ihnen wirklich funktionieren." },
  { title: "Transparent & partnerschaftlich", description: "Wir arbeiten auf Augenhöhe und kommunizieren offen über Chancen und Grenzen." },
  { title: "Messbare Ergebnisse",             description: "Jede Maßnahme hat klare KPIs. Sie sehen jederzeit, was Ihre KI-Investition bringt." },
];

export default function AboutSection() {
  return (
    <section id="ueber-uns" className="section-padding bg-white">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <div>
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="section-label w-fit">
              Über uns
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, delay:0.1 }} className="section-title mb-6">
              KI-Technologie, die dem Mittelstand gehört
            </motion.h2>
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, delay:0.2 }} className="space-y-4 text-slate-600 leading-relaxed mb-10">
              <p>Flowturai wurde mit einer klaren Vision gegründet: Leistungsstarke KI- und Automatisierungstechnologie soll nicht nur Großkonzernen zugutekommen. Kleine und mittelständische Unternehmen haben oft die gleichen Herausforderungen – aber selten die gleichen Ressourcen.</p>
              <p>Genau hier setzen wir an. Als spezialisierter Partner für KMU bringen wir Enterprise-KI auf ein Level, das für Ihr Unternehmen praktisch, bezahlbar und wirkungsvoll ist.</p>
            </motion.div>
            <div className="space-y-4">
              {values.map((v, i) => (
                <motion.div key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.3+i*0.1 }} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#c6e2ff", border: "1px solid #93c5fd" }}>
                    <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                      <path d="M2 6l3 3 5-5" stroke="#1E40AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-slate-900 text-sm mb-1">{v.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{v.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Founder + CTA */}
          <div>
            <motion.p initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="font-heading text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Gründer
            </motion.p>

            <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="flex gap-4 p-5 rounded-2xl border border-[#DBEAFE] hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-white mb-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white font-heading font-bold text-lg" style={{ background: "linear-gradient(135deg,#2563EB,#1E40AF)" }}>
                JJ
              </div>
              <div>
                <h4 className="font-heading font-semibold text-slate-900 text-base leading-tight">Jeremy Jung</h4>
                <p className="text-xs font-semibold mb-1.5 text-blue-600">Gründer & CEO</p>
                <p className="text-sm text-slate-600 leading-relaxed">KI-Stratege mit Leidenschaft für praxisnahe Lösungen und nachhaltige Digitalisierung im Mittelstand. Jeremy begleitet jeden Kunden persönlich – von der ersten Analyse bis zur fertigen Implementierung.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.3 }} className="p-5 rounded-2xl text-white" style={{ background: "linear-gradient(135deg,#2563EB,#1E40AF)" }}>
              <p className="font-heading font-semibold text-lg mb-1">Wir wachsen weiter.</p>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">Sie sind KI-Experte und möchten den Mittelstand transformieren? Sprechen Sie uns an.</p>
              <a href="mailto:info@flowturai.de" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white border border-blue-400 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Kontakt aufnehmen →
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
