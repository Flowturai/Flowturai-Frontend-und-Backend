import HeroSection from "@/components/HeroSection";
import ClaimsSlider from "@/components/ClaimsSlider";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import PricingSection from "@/components/PricingSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ClaimsSlider />
      <ServicesSection />
      <AboutSection />
      <PricingSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
