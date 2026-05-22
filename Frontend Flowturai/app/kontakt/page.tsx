"use client";
import Link from "next/link";
import { useState } from "react";

// Metadata wird in separater Datei definiert (Next.js App Router: Client Components brauchen generateMetadata in layout oder separater Datei)

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-[#DBEAFE] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";

export default function Kontakt() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    honeypot: "", // unsichtbares Spam-Schutz-Feld
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (v: string) =>
    setFormData((prev) => ({ ...prev, [field]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot-Check: Wenn das Feld befüllt ist, ist es ein Bot
    if (formData.honeypot) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/book-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

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

        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-4">Kontakt</h1>
        <p className="text-slate-500 text-base leading-relaxed mb-12">
          Kostenloses Erstgespräch — 30 Minuten, unverbindlich, konkret. Wir antworten innerhalb von 24 Stunden.
        </p>

        <div className="grid sm:grid-cols-2 gap-12 mb-14">
          {/* Kontaktdaten */}
          <div className="space-y-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Direkt erreichen</h2>

            {[
              {
                label: "Telefon",
                value: "+49 152 28352609",
                href: "tel:+4915228352609",
                icon: (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M2.5 5.833C2.5 5.373 2.873 5 3.333 5h2.834c.184 0 .36.067.497.188l2.5 2.199a.833.833 0 010 1.237L7.25 10.25c.34.737.795 1.42 1.354 2.02.6.559 1.283 1.013 2.02 1.354l1.626-1.914a.833.833 0 011.237 0l2.199 2.5c.121.137.188.313.188.497v2.834a.833.833 0 01-.833.833c-8.284 0-12.5-4.216-12.5-12.5z"/>
                  </svg>
                ),
              },
              {
                label: "E-Mail",
                value: "info@flowturai.de",
                href: "mailto:info@flowturai.de",
                icon: (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M2.5 5h15l-7.5 7L2.5 5z"/><path d="M2.5 5v10h15V5"/>
                  </svg>
                ),
              },
              {
                label: "Standort",
                value: "Hamburg, Deutschland",
                href: null,
                icon: (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="10" cy="8" r="3"/><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/>
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-blue-600" style={{ backgroundColor: "#c6e2ff", border: "1px solid #93c5fd" }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-slate-800 font-medium hover:text-blue-600 transition-colors text-sm">{item.value}</a>
                  ) : (
                    <p className="text-slate-800 font-medium text-sm">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Formular */}
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-5">Nachricht senden</h2>

            {submitted ? (
              <div className="rounded-xl border border-blue-200 p-8 text-center" style={{ backgroundColor: "#EFF6FF" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#c6e2ff" }}>
                  <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M5 13l4 4L19 7" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="font-semibold text-slate-900 mb-1">Nachricht erhalten!</p>
                <p className="text-sm text-slate-600">Wir melden uns innerhalb von 24 Stunden.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot — für Screenreader und Menschen unsichtbar */}
                <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
                  <label htmlFor="hp-field">Website</label>
                  <input
                    id="hp-field"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.honeypot}
                    onChange={(e) => set("honeypot")(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="k-name">Name *</label>
                  <input id="k-name" type="text" required value={formData.name} onChange={(e) => set("name")(e.target.value)} placeholder="Max Mustermann" className={inputCls} disabled={loading} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="k-email">E-Mail *</label>
                  <input id="k-email" type="email" required value={formData.email} onChange={(e) => set("email")(e.target.value)} placeholder="max@mustermann.de" className={inputCls} disabled={loading} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="k-message">Nachricht *</label>
                  <textarea id="k-message" rows={4} required value={formData.message} onChange={(e) => set("message")(e.target.value)} placeholder="Kurz beschreiben, womit wir helfen können…" className={inputCls + " resize-none"} disabled={loading} />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full font-semibold text-sm text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
                >
                  {loading ? "Wird gesendet…" : "Nachricht absenden →"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4">
          <Link href="/impressum" className="text-xs text-blue-600 hover:underline">Impressum</Link>
          <Link href="/datenschutz" className="text-xs text-blue-600 hover:underline">Datenschutzerklärung</Link>
          <Link href="/agb" className="text-xs text-blue-600 hover:underline">AGB</Link>
        </div>
      </div>
    </main>
  );
}
