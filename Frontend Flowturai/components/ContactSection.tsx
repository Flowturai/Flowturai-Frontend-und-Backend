"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/neon-button";

const PACKAGES = [
  "Quick Start",
  "Professional",
  "Advanced",
  "Enterprise",
  "Basis Betreuung",
  "Standard Betreuung",
  "Premium Betreuung",
  "Noch nicht sicher",
];

const contactInfo = [
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2.5 5.833C2.5 5.373 2.873 5 3.333 5h2.834c.184 0 .36.067.497.188l2.5 2.199a.833.833 0 010 1.237L7.25 10.25c.34.737.795 1.42 1.354 2.02.6.559 1.283 1.013 2.02 1.354l1.626-1.914a.833.833 0 011.237 0l2.199 2.5c.121.137.188.313.188.497v2.834a.833.833 0 01-.833.833c-8.284 0-12.5-4.216-12.5-12.5z"/></svg>, label:"Telefon", value:"+49 152 28352609", href:"tel:+4915228352609" },
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2.5 5h15l-7.5 7L2.5 5z"/><path d="M2.5 5v10h15V5"/></svg>, label:"E-Mail", value:"info@flowturai.de", href:"mailto:info@flowturai.de" },
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="10" cy="8" r="3"/><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/></svg>, label:"Standort", value:"Deutschland", href:null },
];

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-[#DBEAFE] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    company: "",
    message: "",
    privacy: false,
    selectedPackage: "",
    preferredDate: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedPackage");
      if (saved) {
        setFormData((prev) => ({ ...prev, selectedPackage: saved }));
        localStorage.removeItem("selectedPackage");
      }
    }
  }, []);

  const todayISO = new Date().toISOString().split("T")[0];
  const set = (field: string) => (v: string) => setFormData(prev => ({ ...prev, [field]: v }));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/book-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            formData.name,
          email:           formData.email,
          phone:           formData.phone,
          address:         formData.address,
          city:            formData.city,
          company:         formData.company,
          message:         formData.message,
          selectedPackage: formData.selectedPackage || undefined,
          preferredDate:   formData.preferredDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Verbindungsfehler. Bitte überprüfe deine Internetverbindung und versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="kontakt" className="section-padding bg-white">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Info */}
          <div>
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="section-label w-fit">Kontakt</motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, delay:0.1 }} className="section-title mb-5">Bereit für Ihre KI-Transformation?</motion.h2>
            <motion.p initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.55, delay:0.2 }} className="section-subtitle mb-10">
              Vereinbaren Sie ein kostenfreies Erstgespräch. Wir analysieren gemeinsam Ihr Potenzial und zeigen, welche KI-Lösungen für Ihr Unternehmen sinnvoll sind.
            </motion.p>

            <div className="space-y-4 mb-10">
              {contactInfo.map((item, i) => (
                <motion.div key={i} initial={{ opacity:0, x:-16 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.3+i*0.08 }} className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-blue-600" style={{ backgroundColor:"#c6e2ff", border:"1px solid #93c5fd" }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                    {item.href
                      ? <a href={item.href} className="text-slate-800 font-medium hover:text-blue-600 transition-colors text-sm">{item.value}</a>
                      : <p className="text-slate-800 font-medium text-sm">{item.value}</p>
                    }
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.5 }} className="p-5 rounded-2xl border border-[#DBEAFE]" style={{ backgroundColor:"#F0F8FF" }}>
              <p className="font-heading font-semibold text-slate-900 text-sm mb-3">Ihr Erstgespräch ist kostenlos und unverbindlich.</p>
              <ul className="space-y-2">
                {["30-minütiges Kennenlerngespräch","Ehrliche Einschätzung Ihres KI-Potenzials","Keine versteckten Kosten","Antwort innerhalb von 24 Stunden"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg viewBox="0 0 12 12" fill="none" width="12" height="12" className="shrink-0">
                      <circle cx="6" cy="6" r="5" fill="#c6e2ff" stroke="#93c5fd"/>
                      <path d="M3.5 6l2 2 3-3" stroke="#1E40AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Form */}
          <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.2 }}>
            {submitted ? (
              <div className="rounded-2xl border border-blue-200 p-10 text-center" style={{ backgroundColor:"#EFF6FF" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor:"#c6e2ff" }}>
                  <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M5 13l4 4L19 7" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">Nachricht gesendet!</h3>
                <p className="text-slate-600 text-sm">Vielen Dank! Wir melden uns innerhalb von 24 Stunden bei Ihnen.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm p-7 space-y-5">
                <h3 className="font-heading text-xl font-bold text-slate-900">Nachricht senden</h3>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Name + Unternehmen */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="name">Name *</label>
                    <input id="name" type="text" required value={formData.name} onChange={e=>set("name")(e.target.value)} placeholder="Max Mustermann" className={inputCls} disabled={loading}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="company">Unternehmen</label>
                    <input id="company" type="text" value={formData.company} onChange={e=>set("company")(e.target.value)} placeholder="Mustermann GmbH" className={inputCls} disabled={loading}/>
                  </div>
                </div>

                {/* E-Mail + Telefon */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">E-Mail-Adresse *</label>
                    <input id="email" type="email" required value={formData.email} onChange={e=>set("email")(e.target.value)} placeholder="max@mustermann.de" className={inputCls} disabled={loading}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="phone">Telefonnummer *</label>
                    <input id="phone" type="tel" required value={formData.phone} onChange={e=>set("phone")(e.target.value)} placeholder="+49 151 12345678" className={inputCls} disabled={loading}/>
                  </div>
                </div>

                {/* Straße */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="address">Straße &amp; Hausnummer *</label>
                  <input id="address" type="text" required value={formData.address} onChange={e=>set("address")(e.target.value)} placeholder="Musterstraße 12" className={inputCls} disabled={loading}/>
                </div>

                {/* PLZ + Ort */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="city">PLZ &amp; Ort *</label>
                  <input id="city" type="text" required value={formData.city} onChange={e=>set("city")(e.target.value)} placeholder="22099 Hamburg" className={inputCls} disabled={loading}/>
                </div>

                {/* Paketauswahl */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="selectedPackage">
                    Interessiertes Paket
                    {formData.selectedPackage && formData.selectedPackage !== "Noch nicht sicher" && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        vorausgewählt
                      </span>
                    )}
                  </label>
                  <select id="selectedPackage" value={formData.selectedPackage} onChange={e=>set("selectedPackage")(e.target.value)} className={inputCls + " bg-white"} disabled={loading}>
                    <option value="">— Bitte wählen (optional) —</option>
                    {PACKAGES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Wunschtermin — jetzt Pflichtfeld */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="preferredDate">
                    Wunschtermin für Erstgespräch *
                  </label>
                  <input
                    id="preferredDate"
                    type="date"
                    required
                    min={todayISO}
                    value={formData.preferredDate}
                    onChange={e=>set("preferredDate")(e.target.value)}
                    className={inputCls}
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-400 mt-1">Kein verbindlicher Termin – wir melden uns zur Bestätigung.</p>
                </div>

                {/* Nachricht */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="message">Ihre Anfrage *</label>
                  <textarea id="message" rows={4} required value={formData.message} onChange={e=>set("message")(e.target.value)} placeholder="Beschreiben Sie kurz Ihr Unternehmen und welche Prozesse Sie optimieren möchten..." className={inputCls + " resize-none"} disabled={loading}/>
                </div>

                {/* Datenschutz */}
                <div className="flex items-start gap-2.5">
                  <input id="privacy" type="checkbox" required checked={formData.privacy} onChange={e=>setFormData({...formData,privacy:e.target.checked})} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" disabled={loading}/>
                  <label htmlFor="privacy" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                    Ich stimme der Verarbeitung meiner Daten gemäß der <a href="/datenschutz" className="text-blue-600 hover:underline">Datenschutzerklärung</a> zu. *
                  </label>
                </div>

                <Button type="submit" variant="solid" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Wird gesendet…" : "Nachricht absenden →"}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
