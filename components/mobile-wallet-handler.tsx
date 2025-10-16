'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from './ui/button';

export function MobileWalletHandler() {
  const [isPWA, setIsPWA] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);

  useEffect(() => {
    // Detect if running as PWA
    const isStandalone = ('standalone' in window.navigator && 
                         (window.navigator as { standalone?: boolean }).standalone) || 
                         window.matchMedia('(display-mode: standalone)').matches;
    
    // Detect mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    setIsPWA(isStandalone);
    setIsMobile(isMobileDevice);
  }, []);

  const openInBrowser = () => {
    const currentUrl = window.location.href;
    // Try to open in default browser
    window.open(currentUrl, '_blank');
  };

  const openMetaMaskDeepLink = () => {
    const currentUrl = encodeURIComponent(window.location.href);
    // MetaMask mobile deep link
    window.location.href = `https://metamask.app.link/dapp/${currentUrl}`;
  };

  if (isPWA && isMobile) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-card border-2 border-border rounded-lg">
          <h4 className="font-semibold text-foreground mb-2">
            📱 Mobile PWA Wallet Connection
          </h4>

          {!showMobileInstructions ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You're using the PWA on mobile. Try connecting below, or see mobile-specific options:
              </p>
              
              <div className="space-y-2">
                <ConnectButton />
                
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={openInBrowser}
                    variant="outline"
                    size="sm"
                  >
                    Open in Browser
                  </Button>
                  
                  <Button 
                    onClick={openMetaMaskDeepLink}
                    variant="outline" 
                    size="sm"
                  >
                    Open in MetaMask
                  </Button>
                </div>
                
                <Button
                  onClick={() => setShowMobileInstructions(true)}
                  variant="link"
                  size="sm"
                  className="text-xs"
                >
                  Need help? See detailed instructions
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Mobile PWA Wallet Connection Guide:</p>
              
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Option 1: Open in Browser</p>
                  <ol className="list-decimal list-inside text-xs ml-2 space-y-1">
                    <li>Click "Open in Browser" above</li>
                    <li>Connect your wallet in the browser version</li>
                    <li>Return to this PWA - connection should persist</li>
                  </ol>
                </div>
                
                <div>
                  <p className="font-medium">Option 2: MetaMask Mobile</p>
                  <ol className="list-decimal list-inside text-xs ml-2 space-y-1">
                    <li>Install MetaMask mobile app if not installed</li>
                    <li>Click "Open in MetaMask" above</li>
                    <li>Follow connection prompts in MetaMask app</li>
                  </ol>
                </div>
                
                <div>
                  <p className="font-medium">Option 3: WalletConnect</p>
                  <ol className="list-decimal list-inside text-xs ml-2 space-y-1">
                    <li>Try the "Connect Wallet" button below</li>
                    <li>Select "WalletConnect" option</li>
                    <li>Scan QR code with your mobile wallet</li>
                  </ol>
                </div>
              </div>
              
              <ConnectButton />

              <Button
                onClick={() => setShowMobileInstructions(false)}
                variant="link"
                size="sm"
                className="text-xs"
              >
                Hide instructions
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default RainbowKit connect button for non-PWA or desktop
  return <ConnectButton />;
}