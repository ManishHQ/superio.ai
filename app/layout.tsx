import type {Metadata} from "next";
import {Geist, Geist_Mono, Orbitron} from "next/font/google";
//@ts-ignore : No Typescript Import.
import "./globals.css";
import {Providers} from "./providers";
import {PWAInstall} from "../components/pwa-install";
import {MatrixRainWrapper} from "../components/matrix-rain-wrapper";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const orbitron = Orbitron({
    variable: "--font-orbitron",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    title: "Superio - Your Onchain Superintelligence",
    description: "Advanced AI-powered blockchain analytics, DeFi insights, and intelligent transaction preparation. Analyze transactions, discover yield opportunities, and interact with Web3 using AI.",
    keywords: ["blockchain", "AI", "DeFi", "Web3", "crypto", "analytics", "yield farming", "onchain intelligence"],
    authors: [{ name: "Superio" }],
    creator: "Superio",
    publisher: "Superio",
    applicationName: "Superio",
    icons: {
        icon: [
            { url: '/superio-logo-transparent.png' },
            { url: '/superio-logo-transparent.png', sizes: '192x192', type: 'image/png' },
            { url: '/superio-logo-transparent.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
            { url: '/superio-logo-transparent.png' },
            { url: '/superio-logo-transparent.png', sizes: '180x180', type: 'image/png' },
        ],
        shortcut: '/superio-logo-transparent.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Superio",
        startupImage: '/superio-logo-transparent.png',
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        title: "Superio - Your Onchain Superintelligence",
        description: "Advanced AI-powered blockchain analytics and DeFi intelligence",
        siteName: "Superio",
        images: [
            {
                url: '/superio-logo-transparent.png',
                width: 1200,
                height: 630,
                alt: 'Superio - Your Onchain Superintelligence',
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Superio - Your Onchain Superintelligence",
        description: "Advanced AI-powered blockchain analytics and DeFi intelligence",
        images: ['/superio-logo-transparent.png'],
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#00ff41",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="matrix">
            <body className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}>
                <MatrixRainWrapper />
                <Providers>
                    {children}
                    </Providers>
                <PWAInstall />
            </body>
        </html>
    );
}
