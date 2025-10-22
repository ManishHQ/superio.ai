'use client';

import { useAccount, useEnsName, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { WalletConnection } from '@/components/wallet-connection';

export default function ProfilePage() {
  const { address, isConnected, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Not Connected</h2>
            <p className="text-muted-foreground mb-6">Please connect your wallet to view profile</p>
            <WalletConnection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Wallet Information */}
        <div className="bg-card border-2 border-border rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Wallet Information</h2>
            <WalletConnection />
          </div>

          <div className="space-y-4">
            <div className="bg-secondary rounded-lg p-4 border border-border">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Wallet Address
              </label>
              <p className="font-mono text-sm text-foreground break-all bg-background p-3 rounded border border-border">
                {address}
              </p>
            </div>

            {ensName && (
              <div className="bg-secondary rounded-lg p-4 border border-border">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  ENS Name
                </label>
                <p className="text-lg font-semibold text-accent">
                  {ensName}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {balance && (
                <div className="bg-secondary rounded-lg p-4 border-2 border-primary">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Balance
                  </label>
                  <p className="text-lg font-bold text-foreground">
                    {parseFloat(balance.formatted).toFixed(4)}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {balance.symbol}
                  </p>
                </div>
              )}

              {chain && (
                <div className="bg-secondary rounded-lg p-4 border-2 border-destructive">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Network
                  </label>
                  <p className="text-lg font-bold text-foreground">
                    {chain.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-xs text-muted-foreground">
                      Connected
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card border-2 border-border rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded border border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Email Notifications</h3>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary rounded border border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Chat History</h3>
                <p className="text-xs text-muted-foreground">Save conversation history</p>
              </div>
              <Button variant="outline" size="sm">
                Enabled
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary rounded border border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Matrix Theme</h3>
                <p className="text-xs text-muted-foreground">Terminal-style interface</p>
              </div>
              <Button variant="outline" size="sm">
                Active
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card border-2 border-destructive rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold text-destructive mb-4">Danger Zone</h2>

          <div className="space-y-3">
            <Button variant="destructive" className="w-full sm:w-auto">
              Clear All Chat History
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto ml-0 sm:ml-3">
              Delete Account Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
