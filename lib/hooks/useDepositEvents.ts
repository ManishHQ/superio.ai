'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { VAULT_ADDRESS } from '@/lib/contracts';

export interface DepositEvent {
  txHash: string;
  amount: string;
  timestamp: number;
  status: 'success' | 'pending' | 'error';
}

export function useDepositEvents() {
  const { address } = useAccount();
  const [events, setEvents] = useState<DepositEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepositEvents = useCallback(async () => {
    if (!address) {
      setEvents([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch internal transactions (contract calls) from Etherscan
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${VAULT_ADDRESS}&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'YourApiKeyToken'}`
      );

      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        // Filter for deposit function calls (input data contains deposit signature)
        const depositEvents = data.result
          .filter((tx: any) => {
            // Deposit function signature: 0x6e553f65 (first 4 bytes of keccak256('deposit(uint256,address)'))
            return (
              tx.from?.toLowerCase() === address.toLowerCase() &&
              tx.to?.toLowerCase() === VAULT_ADDRESS.toLowerCase() &&
              tx.input?.startsWith('0x6e553f65') &&
              tx.isError === '0'
            );
          })
          .map((tx: any) => ({
            txHash: tx.hash,
            amount: tx.value ? (Number(tx.value) / 1e18).toFixed(4) : '0',
            timestamp: parseInt(tx.timeStamp) * 1000,
            status: 'success' as const,
          }))
          .sort((a: DepositEvent, b: DepositEvent) => b.timestamp - a.timestamp)
          .slice(0, 10); // Last 10 deposits

        setEvents(depositEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching deposit events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchDepositEvents();

    // Poll for new events every 15 seconds
    const interval = setInterval(fetchDepositEvents, 15000);

    return () => clearInterval(interval);
  }, [fetchDepositEvents]);

  return { events, isLoading, error, refetch: fetchDepositEvents };
}
