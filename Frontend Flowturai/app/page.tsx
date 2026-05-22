import HeroSection from "@/components/HeroSection";
import ClaimsSlider from "@/components/ClaimsSlider";
import ServicesSection from "@/components/ServicesSection";
import WebPricingSection from "@/components/WebPricingSection";
import AboutSection from "@/components/AboutSection";
import PricingSection from "@/components/PricingSection";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ClaimsSlider />
      <ServicesSection />
      <WebPricingSection />
      <AboutSection />
      <PricingSection />
      <ContactSection />
    </main>
  );
}
