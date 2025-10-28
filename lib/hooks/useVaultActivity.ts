"use client";

import { useEffect, useState, useCallback } from "react";
import { VAULT_ADDRESS } from "@/lib/contracts";

export interface VaultActivity {
  txHash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: number;
  functionName: string;
  isError: string;
  blockNumber: number;
  gas: string;
  gasUsed: string;
  gasPrice: string;
}

export function useVaultActivity() {
  const [activities, setActivities] = useState<VaultActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVaultActivity = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch transactions for vault contract using Etherscan API
      const response = await fetch(
        `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${VAULT_ADDRESS}&page=1&offset=5&sort=desc&apikey=${
          process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "YourApiKeyToken"
        }`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vault activity");
      }

      const data = await response.json();

      if (data.status === "1" && Array.isArray(data.result)) {
        // Filter out internal transactions and errors
        const filteredActivities = data.result
          .filter((tx: any) => tx.isError === "0") // Only successful transactions
          .slice(0, 5); // Last 5 transactions

        setActivities(filteredActivities);
      } else {
        setActivities([]);
        if (data.message && data.message !== "OK") {
          setError(data.message);
        }
      }
    } catch (err) {
      console.error("Error fetching vault activity:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch activity");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultActivity();

    // Poll for new activity every 30 seconds
    const interval = setInterval(fetchVaultActivity, 30000);

    return () => clearInterval(interval);
  }, [fetchVaultActivity]);

  return { activities, isLoading, error, refetch: fetchVaultActivity };
}
