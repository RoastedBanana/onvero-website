import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Onvero — KI-Infrastruktur für dein Unternehmen",
  description: "Wir bauen KI-Infrastruktur für dein Unternehmen — von der Website bis zum internen Tool. Ohne technische Vorkenntnisse. Einfach wirksam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers><CookieConsent /></body>
    </html>
  );
}
