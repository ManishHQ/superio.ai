'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                        !('MSStream' in window);
    setIsIOS(isIOSDevice);

    // Check if app is running in standalone mode
    const isStandaloneMode = ('standalone' in window.navigator && 
                             (window.navigator as { standalone?: boolean }).standalone) || 
                           window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Don't show install prompt if already installed or on unsupported browsers
  if (isStandalone || (!showInstallPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Install App</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {isIOS 
              ? 'Tap the share button and select "Add to Home Screen"'
              : 'Install this app on your device for a better experience'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {!isIOS && (
            <Button onClick={handleInstallClick} size="sm">
              Install
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowInstallPrompt(false)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}