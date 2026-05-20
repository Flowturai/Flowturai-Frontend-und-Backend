"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { Button } from "@/components/ui/neon-button";
import { Briefcase, CheckCheck, Database, Server, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const integrationPlans = [
  {
    name: "Quick Start",
    description: "Einstieg in die Automatisierung – ein fokussierter Prozess, schnell und wirkungsvoll.",
    price: 995,
    duration: "ca. 2–3 Wochen",
    buttonText: "Jetzt starten",
    popular: false,
    features: [
      { text: "1 automatisierter Prozess", icon: <Briefcase size={18} /> },
      { text: "Ist-Analyse & Konzeption",  icon: <Database size={18} /> },
      { text: "2 Wochen Nachbetreuung",    icon: <Server size={18} /> },
    ],
    includes: [
      "Inklusive:",
      "Implementierung & Testing",
      "Übergabe-Dokumentation",
      "DSGVO-Beratung",
    ],
  },
  {
    name: "Professional",
    description: "Mehrere Prozesse verknüpft – für spürbare, messbare Effizienzgewinne.",
    price: 2495,
    duration: "ca. 4–6 Wochen",
    buttonText: "Empfohlen wählen",
    popular: true,
    features: [
      { text: "Bis zu 3 automatisierte Prozesse", icon: <Briefcase size={18} /> },
      { text: "API-Anbindung & Systemintegration", icon: <Database size={18} /> },
      { text: "4 Wochen Nachbetreuung",            icon: <Server size={18} /> },
    ],
    includes: [
      "Alles aus Quick Start, plus:",
      "Multi-System-Integration",
      "Übergabe inkl. Einführung",
      "Erweitertes Reporting",
    ],
  },
  {
    name: "Advanced",
    description: "Komplexe Automatisierungen und ein maßgeschneidertes KI-Modell für Ihr Unternehmen.",
    price: 4995,
    duration: "ca. 6–10 Wochen",
    buttonText: "Projekt anfragen",
    popular: false,
    features: [
      { text: "Bis zu 8 Prozesse & Custom KI",  icon: <Briefcase size={18} /> },
      { text: "KI-Modell-Entwicklung & Training", icon: <Database size={18} /> },
      { text: "8 Wochen Nachbetreuung",           icon: <Server size={18} /> },
    ],
    includes: [
      "Alles aus Professional, plus:",
      "Custom KI-Modell-Entwicklung",
      "Vollständige Projektdokumentation",
      "Multi-System-Integration",
    ],
  },
  {
    name: "Enterprise",
    description: "Vollumfängliche digitale KI-Transformation – maßgeschneidert auf Ihre Größe.",
    price: 0,
    duration: "Individuell",
    buttonText: "Angebot anfragen",
    popular: false,
    features: [
      { text: "Unbegrenzte Prozessautomatisierung", icon: <Briefcase size={18} /> },
      { text: "Vollständige Systemintegration",      icon: <Database size={18} /> },
      { text: "Individuelle Nachbetreuung",          icon: <Server size={18} /> },
    ],
    includes: [
      "Alles aus Advanced, plus:",
      "Dediziertes Projektmanagement",
      "Individuelle KI-Roadmap",
      "Individuelle SLA-Vereinbarung",
    ],
  },
];

const betreuungPlans = [
  {
    name: "Basis",
    description: "Grundlegende Überwachung Ihrer implementierten KI-Systeme.",
    price: 149,
    buttonText: "Basis wählen",
    popular: false,
    features: [
      { text: "System-Monitoring",        icon: <Server size={18} /> },
      { text: "Fehler-Alerting",          icon: <Zap size={18} /> },
      { text: "Monatlicher Status-Report", icon: <Database size={18} /> },
    ],
    includes: [
      "Inklusive:",
      "E-Mail Support (48h Reaktionszeit)",
      "Monatlicher Status-Report",
      "Fehler-Alerting",
    ],
  },
  {
    name: "Standard",
    description: "Aktive Betreuung, kontinuierliche Optimierungen und regelmäßiges Review.",
    price: 349,
    buttonText: "Standard wählen",
    popular: true,
    features: [
      { text: "Performance-Optimierungen",   icon: <Server size={18} /> },
      { text: "Prioritäts-Support (< 24h)",  icon: <Zap size={18} /> },
      { text: "Quartalsweises Review",       icon: <Database size={18} /> },
    ],
    includes: [
      "Alles aus Basis, plus:",
      "Performance-Optimierungen",
      "Prioritäts-Support (< 24h)",
      "Quartalsweises Strategie-Gespräch",
    ],
  },
  {
    name: "Premium",
    description: "Maximale Betreuung und proaktive Weiterentwicklung Ihrer KI-Systeme.",
    price: 699,
    buttonText: "Premium wählen",
    popular: false,
    features: [
      { text: "Proaktive Optimierungen",   icon: <Server size={18} /> },
      { text: "Direkt-Support (< 4h)",     icon: <Zap size={18} /> },
      { text: "Monatliches Review-Gespräch", icon: <Database size={18} /> },
    ],
    includes: [
      "Alles aus Standard, plus:",
      "Proaktive Systemoptimierungen",
      "Direkt-Support (< 4h)",
      "Monatliches Review-Gespräch",
    ],
  },
];

// ── Toggle Switch ─────────────────────────────────────────────────────────────

const PricingSwitch = ({ onSwitch }: { onSwitch: (value: string) => void }) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative z-50 mx-auto flex w-fit rounded-full bg-white border border-[#DBEAFE] p-1 shadow-sm">
        {[
          { val: "0", label: "Einmalige Integration", badge: null },
          { val: "1", label: "Laufende Betreuung",    badge: "monatl. kündbar" },
        ].map(({ val, label, badge }) => (
          <button
            key={val}
            onClick={() => handleSwitch(val)}
            className={`relative z-10 w-fit h-9 sm:h-11 rounded-full sm:px-5 px-3 py-1 font-medium transition-colors ${
              selected === val ? "text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {selected === val && (
              <motion.span
                layoutId="pricing-switch"
                className="absolute top-0 left-0 h-9 sm:h-11 w-full rounded-full border-4 shadow-sm shadow-blue-500 border-blue-500 bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              {label}
              {badge && (
                <span className="rounded-full bg-[#c6e2ff] px-1.5 py-0.5 text-[10px] sm:text-xs font-medium text-blue-800">
                  {badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function PricingSection() {
  const [isBetreuung, setIsBetreuung] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0, opacity: 1, filter: "blur(0px)",
      transition: { delay: i * 0.15, duration: 0.5 },
    }),
    hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
  };

  const plans = isBetreuung ? betreuungPlans : integrationPlans;
  const suffix = isBetreuung ? "/Monat" : " einmalig";

  const handlePlanClick = (planName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPackage", planName);
    }
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      id="preise"
      className="px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 mx-auto relative overflow-hidden"
      style={{ backgroundColor: "#F0F8FF" }}
      ref={pricingRef}
    >
      {/* Blue radial glow */}
      <div
        className="absolute top-0 left-[10%] w-[80%] h-full z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, #c6e2ff 0%, transparent 70%)",
          opacity: 0.5,
          mixBlendMode: "multiply",
        }}
      />

      {/* Header */}
      <div className="text-center mb-8 max-w-3xl mx-auto relative z-10">
        <TimelineContent
          as="p"
          animationNum={0}
          customVariants={revealVariants}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-wider section-label"
        >
          Preise & Pakete
        </TimelineContent>

        <TimelineContent
          as="h2"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="md:text-6xl sm:text-5xl text-4xl font-extrabold text-gray-900 mb-4 font-heading tracking-tighter"
        >
          Fair. Skalierbar. Transparent.
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={3}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-slate-600 text-base mx-auto max-w-xl"
        >
          Einmalige Integration nach Ihrem Bedarf – danach optional günstige laufende Betreuung. Alle Preise zzgl. MwSt., DSGVO-konform.
        </TimelineContent>
      </div>

      {/* Switch */}
      <TimelineContent
        as="div"
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="mb-8 relative z-10"
      >
        <PricingSwitch onSwitch={(v) => setIsBetreuung(v === "1")} />
      </TimelineContent>

      {/* Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isBetreuung ? "betreuung" : "integration"}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className={`relative z-10 mx-auto py-4 ${
            isBetreuung
              ? "grid grid-cols-1 sm:grid-cols-3 max-w-4xl gap-4"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl gap-4"
          }`}
        >
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-[#DBEAFE] ${
                plan.popular
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300"
              }`}
            >
              <CardHeader className="text-left pb-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xl font-bold text-gray-900 font-heading">{plan.name}</h3>
                  {plan.popular && (
                    <span className="bg-blue-500 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0">
                      Empfohlen
                    </span>
                  )}
                </div>

                {"duration" in plan && (
                  <p className="text-xs text-slate-400 font-medium mb-1">{(plan as any).duration}</p>
                )}

                <p className="text-sm text-slate-500 leading-snug mb-3">{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 flex-wrap">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold text-gray-900 font-heading">Auf Anfrage</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900 font-heading tabular-nums">
                        €{plan.price.toLocaleString("de-DE")}
                      </span>
                      <span className="text-slate-500 text-sm">{suffix}</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* CTA */}
                <Button
                  variant={plan.popular ? "solid" : "outline"}
                  size="default"
                  className="w-full mb-5"
                  onClick={() => handlePlanClick(plan.name)}
                >
                  {plan.buttonText}
                </Button>

                {/* Features */}
                <ul className="space-y-2.5 py-4 border-t border-[#DBEAFE]">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-center gap-2.5">
                      <span className="text-blue-500 shrink-0">{feature.icon}</span>
                      <span className="text-sm text-slate-600">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Includes */}
                <div className="space-y-2.5 pt-4 border-t border-[#DBEAFE]">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">{plan.includes[0]}</h4>
                  <ul className="space-y-2">
                    {plan.includes.slice(1).map((item, ii) => (
                      <li key={ii} className="flex items-center gap-2.5">
                        <span className="h-5 w-5 bg-[#c6e2ff] border border-blue-400 rounded-full grid place-content-center shrink-0">
                          <CheckCheck className="h-3 w-3 text-blue-600" />
                        </span>
                        <span className="text-sm text-slate-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Footer note */}
      <p className="text-center text-sm text-slate-500 mt-6 relative z-10">
        Kostenfreies Erstgespräch in jedem Paket inklusive ·{" "}
        <a href="#kontakt" className="text-blue-600 hover:underline font-medium">
          Individuelles Angebot anfragen
        </a>
      </p>
    </div>
  );
}
