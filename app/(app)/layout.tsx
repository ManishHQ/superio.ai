'use client';

import { useAccount } from 'wagmi';
import { Sidebar } from '@/components/sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected, isConnecting } = useAccount();

  // Show loading state while checking connection
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // If not connected, allow the page to render (the chat interface will handle wallet connection)
  if (!isConnected) {
    // Simply render without redirecting - let the chat interface handle the connection requirement
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
