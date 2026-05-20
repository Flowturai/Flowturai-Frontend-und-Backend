"use client";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

const claims = [
  {
    stat: "57 %",
    statSub: null,
    text: "aller Arbeitsstunden sind heute schon automatisierbar.",
    source: "McKinsey & Company, 2025",
  },
  {
    stat: "66 %",
    statSub: "36 %",
    text: "der Unternehmen messen Effizienzgewinne – im Schnitt 36 % weniger Zeitaufwand pro Prozess.",
    source: "Deloitte, State of AI in the Enterprise 2026",
  },
  {
    stat: "333 %",
    statSub: null,
    text: "ROI. Amortisation in unter 6 Monaten. Das ist der bewiesene Durchschnitt bei KI-Automatisierung.",
    source: "Forrester Research, Total Economic Impact™ Study 2024",
  },
];

export default function ClaimsSlider() {
  return (
    <div className="relative w-full overflow-hidden bg-white border-y border-[#DBEAFE] py-6">
      <InfiniteSlider
        className="flex items-stretch"
        duration={45}
        gap={20}
      >
        {claims.map((c, i) => (
          <div
            key={i}
            className="flex flex-col justify-between w-64 sm:w-72 shrink-0 rounded-2xl border border-[#DBEAFE] bg-[#F0F8FF] px-5 py-4 shadow-sm"
          >
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-heading text-3xl font-extrabold text-blue-600 leading-none">
                  {c.stat}
                </span>
                {c.statSub && (
                  <>
                    <span className="text-slate-400 text-sm font-medium">+</span>
                    <span className="font-heading text-xl font-extrabold text-blue-500 leading-none">
                      {c.statSub}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-snug">{c.text}</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Quelle: {c.source}</p>
          </div>
        ))}
      </InfiniteSlider>

      {/* Progressive Blur links */}
      <ProgressiveBlur
        className="pointer-events-none absolute top-0 left-0 h-full w-24 sm:w-40"
        direction="left"
        blurIntensity={0.8}
      />
      {/* Progressive Blur rechts */}
      <ProgressiveBlur
        className="pointer-events-none absolute top-0 right-0 h-full w-24 sm:w-40"
        direction="right"
        blurIntensity={0.8}
      />
    </div>
  );
}
