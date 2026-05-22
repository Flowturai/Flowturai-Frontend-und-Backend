import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flowturai.de"),
  title: {
    default: "Flowturai – KI-Lösungen & Automatisierung für KMU",
    template: "%s | Flowturai",
  },
  description:
    "Flowturai implementiert maßgeschneiderte KI- und Automatisierungslösungen für KMU – praxisnah, messbar und schnell umsetzbar.",
  keywords:
    "KI-Beratung, KI-Implementierung, Automatisierung, KMU, Mittelstand, Deutschland",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://flowturai.de",
    siteName: "Flowturai",
    title: "Flowturai – KI-Lösungen & Automatisierung für KMU",
    description:
      "Flowturai implementiert maßgeschneiderte KI- und Automatisierungslösungen für KMU – praxisnah, messbar und schnell umsetzbar.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Flowturai – KI-Lösungen & Automatisierung für KMU",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowturai – KI-Lösungen & Automatisierung für KMU",
    description:
      "Flowturai implementiert maßgeschneiderte KI- und Automatisierungslösungen für KMU.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        <Navigation />
        {children}
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
