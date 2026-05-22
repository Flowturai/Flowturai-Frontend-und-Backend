"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type Consent = "accepted" | "declined" | null;

const STORAGE_KEY = "flowturai_cookie_consent";

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Consent;
    if (!stored) {
      // Kurze Verzögerung damit die Seite zuerst lädt
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
    setConsent(stored);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      role="dialog"
      aria-label="Cookie-Einwilligung"
      aria-modal="false"
    >
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <circle cx="10" cy="10" r="8" stroke="#2563eb" strokeWidth="1.5"/>
              <circle cx="7"  cy="8"  r="1" fill="#2563eb"/>
              <circle cx="13" cy="7"  r="1" fill="#2563eb"/>
              <circle cx="10" cy="13" r="1" fill="#2563eb"/>
              <circle cx="6"  cy="12" r="0.8" fill="#93c5fd"/>
              <circle cx="14" cy="11" r="0.8" fill="#93c5fd"/>
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-base font-bold text-slate-900 mb-1">
              Cookies & Datenschutz
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Wir verwenden Cookies, um unsere Website zu verbessern und Ihnen relevante Inhalte anzuzeigen. Technisch notwendige Cookies sind immer aktiv. Mit „Akzeptieren" stimmen Sie auch der Verwendung optionaler Cookies (z.&nbsp;B. Analyse) zu.{" "}
              <Link href="/datenschutz" className="text-blue-600 hover:underline font-medium">
                Datenschutzerklärung
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              onClick={handleDecline}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Ablehnen
            </button>
            <button
              onClick={handleAccept}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ background: "#2563eb" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              Akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
