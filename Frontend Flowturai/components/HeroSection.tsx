"use client";
import AnimatedShaderHero from "@/components/ui/animated-shader-hero";

export default function HeroSection() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <AnimatedShaderHero
      trustBadge={{
        icon: "✦",
        text: "KI-Beratung & Automatisierung für den Mittelstand",
      }}
      headline={{
        line1: "KI-Lösungen,",
        line2: "die wirklich wirken.",
      }}
      subtitle="Flowturai berät und implementiert maßgeschneiderte KI- und Automatisierungslösungen – praxisnah, messbar und nachhaltig wirksam."
      buttons={{
        primary: {
          text: "Beratungsgespräch anfragen",
          onClick: () => scrollTo("kontakt"),
        },
        secondary: {
          text: "Leistungen entdecken",
          onClick: () => scrollTo("leistungen"),
        },
      }}
      stats={[
        { value: "100%", label: "Erfolgsrezept" },
        { value: "DSGVO", label: "Auftragsverarbeitung konform" },
      ]}
    />
  );
}
