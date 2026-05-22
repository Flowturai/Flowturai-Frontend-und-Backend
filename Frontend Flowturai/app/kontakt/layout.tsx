import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kostenloses Erstgespräch mit Flowturai – 30 Minuten, unverbindlich. KI-Beratung und Automatisierung für KMU in Deutschland.",
  alternates: { canonical: "/kontakt" },
  openGraph: {
    title: "Kontakt | Flowturai",
    description:
      "Kostenloses Erstgespräch – 30 Minuten, unverbindlich. KI-Beratung und Automatisierung für KMU.",
    url: "/kontakt",
  },
};

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
