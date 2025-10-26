"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  VAULT_ADDRESS,
  MOCK_TOKEN_ADDRESS,
  MOCK_STRATEGY_ADDRESS,
} from "@/lib/contracts";
import { VAULT_ABI } from "@/lib/abis/vault-abi";
import { MOCK_TOKEN_ABI, MOCK_STRATEGY_ABI } from "@/lib/abis/token-abi";

export interface VaultData {
  userBalance: bigint; // User's shares
  userBalanceUSD: number; // User's shares value in USD
  totalAssets: bigint; // Total vault assets
  totalYieldEarned: number; // Total yield earned
  apy: number; // Annual percentage yield
  strategies: StrategyData[];
  isLoading: boolean;
}

export interface StrategyData {
  address: string;
  name: string;
  allocation: number; // percentage 0-100
  deployed: number;
  yield: number;
}

export function useVaultData() {
  const { address: userAddress } = useAccount();
  const [vaultData, setVaultData] = useState<VaultData>({
    userBalance: BigInt(0),
    userBalanceUSD: 0,
    totalAssets: BigInt(0),
    totalYieldEarned: 0,
    apy: 12.5,
    strategies: [],
    isLoading: true,
  });

  // Read user's vault shares
  const { data: userShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "balanceOf",
    args: [userAddress || "0x0"],
    query: {
      enabled: !!userAddress,
    },
  });

  // Read total assets in vault
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalAssets",
    query: {
      enabled: !!userAddress,
    },
  });

  // Read user's token balance
  const { data: userTokenBalance } = useReadContract({
    address: MOCK_TOKEN_ADDRESS,
    abi: MOCK_TOKEN_ABI,
    functionName: "balanceOf",
    args: [userAddress || "0x0"],
    query: {
      enabled: !!userAddress,
    },
  });

  // Read strategy deployed amount
  const { data: strategyDeployed } = useReadContract({
    address: MOCK_STRATEGY_ADDRESS,
    abi: MOCK_STRATEGY_ABI,
    functionName: "totalDeployed",
    query: {
      enabled: !!userAddress,
    },
  });

  // Convert shares to assets
  const { data: userSharesValue } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "convertToAssets",
    args: [userShares || BigInt(0)],
    query: {
      enabled: !!userShares,
    },
  });

  // Update vault data when contract data changes
  useEffect(() => {
    if (userAddress) {
      const userBalanceUSD = userSharesValue
        ? Number(userSharesValue) / 1e18
        : 0;

      const totalAssetsNumber = totalAssets ? Number(totalAssets) / 1e18 : 0;
      const deployedNumber = strategyDeployed
        ? Number(strategyDeployed) / 1e18
        : 0;
      const vaultBalanceNumber = totalAssetsNumber - deployedNumber;

      const totalYield = vaultBalanceNumber > 0 ? userBalanceUSD * 0.1 : 0; // 10% yield estimate

      const strategies: StrategyData[] = [
        {
          address: MOCK_STRATEGY_ADDRESS,
          name: "Mock Strategy",
          allocation: 100,
          deployed: deployedNumber,
          yield: totalYield,
        },
      ];

      setVaultData({
        userBalance: userShares || BigInt(0),
        userBalanceUSD,
        totalAssets: totalAssets || BigInt(0),
        totalYieldEarned: totalYield,
        apy: 12.5,
        strategies,
        isLoading: false,
      });
    }
  }, [userShares, userSharesValue, totalAssets, strategyDeployed, userAddress]);

  return vaultData;
}
