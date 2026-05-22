"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CheckCheck, Globe, Zap, Server, Database, Briefcase } from "lucide-react";

// ── Daten ────────────────────────────────────────────────────────────────────

const einmaligPlans = [
  {
    name: "Starter Web",
    description: "Ihre erste professionelle Online-Präsenz – modern, schnell und SEO-optimiert.",
    price: 1990,
    duration: "ca. 2 Wochen",
    buttonText: "Jetzt starten",
    popular: false,
    features: [
      { text: "Bis zu 5 Seiten", icon: <Globe size={18} /> },
      { text: "Responsive Design", icon: <Zap size={18} /> },
      { text: "Kontaktformular & SEO-Basis", icon: <Briefcase size={18} /> },
    ],
    includes: [
      "Inklusive:",
      "Professionelles Design",
      "Hosting-Setup",
      "Übergabe & Einweisung",
    ],
  },
  {
    name: "Business Web",
    description: "Die vollständige Website für Ihr Unternehmen – mit CMS, damit Sie selbst Inhalte pflegen können.",
    price: 3990,
    duration: "ca. 4 Wochen",
    buttonText: "Empfohlen wählen",
    popular: true,
    features: [
      { text: "Bis zu 15 Seiten", icon: <Globe size={18} /> },
      { text: "CMS-Integration (eigene Inhalte pflegen)", icon: <Database size={18} /> },
      { text: "Formulare, Newsletter & Analytics", icon: <Zap size={18} /> },
    ],
    includes: [
      "Alles aus Starter, plus:",
      "Content-Management-System",
      "Blog / News-Bereich",
      "1 Monat Nachbetreuung",
    ],
  },
  {
    name: "Business Pro",
    description: "Website mit Backend – ideal für Buchungsportale, Kundenportale oder API-Integrationen.",
    price: 6990,
    duration: "ca. 6 Wochen",
    buttonText: "Projekt anfragen",
    popular: false,
    features: [
      { text: "Alles aus Business Web", icon: <Globe size={18} /> },
      { text: "Backend & Datenbank", icon: <Database size={18} /> },
      { text: "API-Anbindung & Drittanbieter-Integration", icon: <Server size={18} /> },
    ],
    includes: [
      "Alles aus Business Web, plus:",
      "Individuelle Backend-Logik",
      "Benutzer-Authentifizierung",
      "2 Monate Nachbetreuung",
    ],
  },
  {
    name: "KI-Suite",
    description: "Ihre Website als aktives Vertriebsinstrument – mit KI-Chat, Automatisierungen und Analytics-Dashboard.",
    price: 11990,
    duration: "ca. 10 Wochen",
    buttonText: "KI-Paket anfragen",
    popular: false,
    features: [
      { text: "Alles aus Business Pro", icon: <Globe size={18} /> },
      { text: "KI-Chatbot & Lead-Qualifizierung", icon: <Zap size={18} /> },
      { text: "Automatisierungen & KI-Analytics", icon: <Database size={18} /> },
    ],
    includes: [
      "Alles aus Business Pro, plus:",
      "KI-gestützter Chatbot",
      "Automatische Lead-Erfassung",
      "3 Monate Nachbetreuung",
    ],
  },
  {
    name: "Enterprise",
    description: "Komplexe Web-Applikationen, Shops oder individuelle Plattformen – nach Maß.",
    price: 0,
    duration: "Individuell",
    buttonText: "Angebot anfragen",
    popular: false,
    features: [
      { text: "Individuelle Architektur", icon: <Server size={18} /> },
      { text: "Skalierbare Infrastruktur", icon: <Database size={18} /> },
      { text: "Dedizierter Ansprechpartner", icon: <Briefcase size={18} /> },
    ],
    includes: [
      "Maßgeschneidert:",
      "E-Commerce & Online-Shops",
      "Kunden- & Mitarbeiterportale",
      "Individuelle Nachbetreuung",
    ],
  },
];

const monatlichPlans = [
  {
    name: "Web-Pflege",
    description: "Ihre Website läuft zuverlässig – wir kümmern uns um alles im Hintergrund.",
    price: 99,
    buttonText: "Pflege buchen",
    popular: false,
    features: [
      { text: "Hosting & SSL-Zertifikat", icon: <Server size={18} /> },
      { text: "Sicherheits-Updates & Monitoring", icon: <Zap size={18} /> },
      { text: "Monatlicher Status-Report", icon: <Briefcase size={18} /> },
    ],
    includes: [
      "Inklusive:",
      "99,9 % Uptime-Garantie",
      "Tägliche Backups",
      "Support per E-Mail",
    ],
  },
  {
    name: "Web-Wachstum",
    description: "Ihre Website wächst kontinuierlich: SEO, Performance und Inhalte, die Kunden bringen.",
    price: 249,
    buttonText: "Wachstum starten",
    popular: true,
    features: [
      { text: "Alles aus Web-Pflege", icon: <Server size={18} /> },
      { text: "SEO-Optimierung & Keyword-Tracking", icon: <Database size={18} /> },
      { text: "Performance-Monitoring & Optimierung", icon: <Zap size={18} /> },
    ],
    includes: [
      "Alles aus Web-Pflege, plus:",
      "Monatliche SEO-Analyse",
      "Content-Updates (bis 2 h)",
      "Conversion-Rate-Tracking",
    ],
  },
];

// ── Hilfs-Komponenten ────────────────────────────────────────────────────────

function PlanCard({
  plan,
  delay,
  onSelect,
}: {
  plan: (typeof einmaligPlans)[0] | (typeof monatlichPlans)[0];
  delay: number;
  onSelect: () => void;
}) {
  const isMonthly = "price" in plan && !("duration" in plan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
        plan.popular
          ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-lg shadow-blue-100/50"
          : "bg-white border-[#DBEAFE] hover:border-blue-300 hover:shadow-md"
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
          ⭐ Empfohlen
        </span>
      )}

      <div className="mb-4">
        <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{plan.description}</p>
      </div>

      <div className="mb-5">
        {plan.price === 0 ? (
          <span className="text-2xl font-bold text-slate-900 font-heading">Auf Anfrage</span>
        ) : (
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-slate-900 font-heading tabular-nums">
              €{plan.price.toLocaleString("de-DE")}
            </span>
            <span className="text-slate-400 text-sm mb-1">
              {"duration" in plan ? ` / ${plan.duration}` : "/Monat"}
            </span>
          </div>
        )}
      </div>

      <ul className="space-y-2.5 mb-5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span className="text-blue-500 mt-0.5 shrink-0">{f.icon}</span>
            {f.text}
          </li>
        ))}
      </ul>

      <div className="mb-6 pt-4 border-t border-[#DBEAFE]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          {plan.includes[0]}
        </p>
        <ul className="space-y-1.5">
          {plan.includes.slice(1).map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#c6e2ff", border: "1px solid #93c5fd" }}>
                <CheckCheck size={11} className="text-blue-700" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSelect}
        className={`mt-auto w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          plan.popular
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            : "bg-white border border-[#DBEAFE] text-slate-700 hover:border-blue-400 hover:text-blue-600"
        }`}
      >
        {plan.buttonText}
      </button>
    </motion.div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function WebPricingSection() {
  const [tab, setTab] = useState<"einmalig" | "monatlich">("einmalig");

  const scrollToContact = (planName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPackage", planName);
    }
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
  };

  const plans = tab === "einmalig" ? einmaligPlans : monatlichPlans;

  return (
    <section id="webentwicklung" className="section-padding bg-white">
      <div className="container-wide">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="section-label w-fit mx-auto"
          >
            Webentwicklung
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="section-title mt-3 mb-4"
          >
            Moderne Websites, die verkaufen
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="section-subtitle max-w-2xl mx-auto"
          >
            KI-beschleunigt entwickelt, transparent kalkuliert — Festpreise statt Stundensatz-Überraschungen.
          </motion.p>
        </div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="flex justify-center mb-10"
        >
          <div className="flex items-center gap-1 p-1 rounded-full border border-[#DBEAFE] bg-white shadow-sm">
            {(["einmalig", "monatlich"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 ${
                  tab === t
                    ? "bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "einmalig" ? "Einmalig" : "Monatlich"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={`grid gap-5 ${
              tab === "einmalig"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
            }`}
          >
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                delay={i * 0.07}
                onSelect={() => scrollToContact(plan.name)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* USP-Box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 rounded-2xl border border-[#DBEAFE] p-8"
          style={{ backgroundColor: "#F0F8FF" }}
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-7">
            Warum Flowturai für Ihre Website?
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap size={22} className="text-blue-600" />,
                title: "KI-beschleunigt",
                text: "Durch KI-gestützte Entwicklung liefern wir schneller — bei gleicher Qualität.",
              },
              {
                icon: <Globe size={22} className="text-blue-600" />,
                title: "Moderner Tech-Stack",
                text: "Next.js, TypeScript, Tailwind — Technologien, die skalieren und bestehen.",
              },
              {
                icon: <CheckCheck size={22} className="text-blue-600" />,
                title: "Festpreise",
                text: "Keine Stundensatz-Überraschungen. Sie wissen vorher genau, was Sie bezahlen.",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#c6e2ff", border: "1px solid #93c5fd" }}>
                  {item.icon}
                </div>
                <h3 className="font-heading font-bold text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
