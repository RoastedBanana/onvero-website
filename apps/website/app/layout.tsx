import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onvero Website',
  description: 'Coming soon.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" style={{ backgroundColor: '#0f0f0f' }}>
      <body className="min-h-screen text-white">{children}</body>
    </html>
  );
}
