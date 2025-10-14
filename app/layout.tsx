import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { PWAInstall } from '../components/pwa-install';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js ShadCN RainbowKit Wagmi",
  description: "Progressive Web App built with Next.js, ShadCN, RainbowKit and Wagmi",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NextApp",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <PWAInstall />
      </body>
    </html>
  );
}
