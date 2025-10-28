"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {getDefaultConfig, RainbowKitProvider, darkTheme} from "@rainbow-me/rainbowkit";
import {WagmiProvider} from "wagmi";
import {mainnet, polygon, optimism, arbitrum, base, sepolia} from "wagmi/chains";
import {QueryClientProvider, QueryClient} from "@tanstack/react-query";

const config = getDefaultConfig({
    appName: "Next.js PWA App",
    projectId: "2f05ae7f1116030fde2d36508f472bfb", // Demo project ID - get your own at https://cloud.walletconnect.com
    chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
    ssr: true,
});

const queryClient = new QueryClient();

const matrixTheme = darkTheme({
    accentColor: "#00ff41",
    accentColorForeground: "#000000",
    borderRadius: "small",
    fontStack: "system",
    overlayBlur: "small",
});

export function Providers({children}: {children: React.ReactNode}) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={matrixTheme}>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
