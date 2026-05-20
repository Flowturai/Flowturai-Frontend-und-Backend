import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

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
  title: "Flowturai – KI-Lösungen & Automatisierung für den Mittelstand",
  description:
    "Flowturai berät und implementiert maßgeschneiderte KI- und Automatisierungslösungen für kleine und mittelständische Unternehmen – praxisnah, effizient und messbar.",
  keywords:
    "KI-Beratung, KI-Implementierung, Automatisierung, Mittelstand, Artificial Intelligence, Deutschland",
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
      </body>
    </html>
  );
}
