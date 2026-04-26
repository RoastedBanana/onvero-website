import type { Metadata } from 'next';
import { Geist, Geist_Mono, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@onvero/ui/app-shell/providers';
import { CookieConsent } from '@onvero/ui/app-shell/CookieConsent';
import { AnalyticsLoader } from '@onvero/ui/app-shell/AnalyticsLoader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Onvero — KI-Infrastruktur für dein Unternehmen',
  description:
    'Wir bauen KI-Infrastruktur für dein Unternehmen — von der Website bis zum internen Tool. Ohne technische Vorkenntnisse. Einfach wirksam.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
      style={{ backgroundColor: '#0f0f0f' }}
    >
      <head />
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <CookieConsent />
        <AnalyticsLoader />
      </body>
    </html>
  );
}
