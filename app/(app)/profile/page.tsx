'use client';

import { useState, useEffect } from 'react';
import { useAccount, useEnsName, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { WalletConnection } from '@/components/wallet-connection';
import { API_ENDPOINTS } from '@/lib/config';

interface OnChainReputation {
  tier: string;
  score: number;
  transactions: number;
  tokenTransfers: number;
  totalInteractions: number;
  uniqueTokens: number;
  contributingFactors: string[];
}

export default function ProfilePage() {
  const { address, isConnected, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
  const [reputation, setReputation] = useState<OnChainReputation | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch on-chain reputation
  useEffect(() => {
    if (!address) return;

    const fetchReputation = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.chat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `analyze address ${address}`,
            user_id: address
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Extract reputation from response
          const responseText = data.response || '';
          
          // Parse the response to extract reputation data
          const tierMatch = responseText.match(/\*\*Tier:\*\* ([^\n]+)/);
          const scoreMatch = responseText.match(/\*\*Score:\*\* (\d+)\/100/);
          const txMatch = responseText.match(/Total Transactions: \*\*(\d+)\*\*/);
          const tokenTxMatch = responseText.match(/Token Transfers: \*\*(\d+)\*\*/);
          const interactionsMatch = responseText.match(/Total Interactions: \*\*(\d+)\*\*/);
          const tokensMatch = responseText.match(/Unique Tokens Held: \*\*(\d+)\*\*/);

          if (tierMatch || scoreMatch) {
            setReputation({
              tier: tierMatch ? tierMatch[1] : 'Unknown',
              score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
              transactions: txMatch ? parseInt(txMatch[1]) : 0,
              tokenTransfers: tokenTxMatch ? parseInt(tokenTxMatch[1]) : 0,
              totalInteractions: interactionsMatch ? parseInt(interactionsMatch[1]) : 0,
              uniqueTokens: tokensMatch ? parseInt(tokensMatch[1]) : 0,
              contributingFactors: []
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch reputation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, [address]);

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

        {/* On-Chain Reputation */}
        <div className="bg-card border-2 border-primary rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">On-Chain Reputation</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading reputation...</span>
            </div>
          ) : reputation ? (
            <div className="space-y-6">
              {/* Reputation Score */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Reputation Score
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl font-bold text-primary">{reputation.score}</div>
                      <div className="text-muted-foreground">/100</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">{reputation.tier}</div>
                    <div className="text-xs text-muted-foreground mt-1">Tier</div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all duration-500"
                    style={{ width: `${reputation.score}%` }}
                  ></div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-secondary rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary">{reputation.transactions}</div>
                  <div className="text-xs text-muted-foreground mt-1">Transactions</div>
                </div>
                
                <div className="bg-secondary rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary">{reputation.tokenTransfers}</div>
                  <div className="text-xs text-muted-foreground mt-1">Token Transfers</div>
                </div>
                
                <div className="bg-secondary rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary">{reputation.totalInteractions}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Actions</div>
                </div>
                
                <div className="bg-secondary rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary">{reputation.uniqueTokens}</div>
                  <div className="text-xs text-muted-foreground mt-1">Unique Tokens</div>
                </div>
              </div>

              {/* Tier Description */}
              <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  Your on-chain reputation is calculated based on your blockchain activity, transaction history, token holdings, and DeFi participation. Maintain consistent activity to improve your score!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No on-chain data available yet. Start using the blockchain to build your reputation!
            </div>
          )}
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
