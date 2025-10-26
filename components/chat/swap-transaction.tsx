'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { sepolia } from 'wagmi/chains';
import { SwapUI } from './message';

// Contract addresses
const SIMPLE_SWAP_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const;
const FET_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;

// ABI for swapETHforFET function
const SIMPLE_SWAP_ABI = [
  {
    inputs: [],
    name: 'swapETHforFET',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'ethAmount', type: 'uint256' }],
    name: 'getFETAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'EXCHANGE_RATE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface SwapTransactionProps {
  swapData: SwapUI;
}

export function SwapTransaction({ swapData }: SwapTransactionProps) {
  const { address, isConnected, chain } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const [txStatus, setTxStatus] = useState<'idle' | 'preparing' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Read the exchange rate from the contract
  const { data: exchangeRate } = useReadContract({
    address: SIMPLE_SWAP_ADDRESS,
    abi: SIMPLE_SWAP_ABI,
    functionName: 'EXCHANGE_RATE',
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate FET amount based on exchange rate
  const ethAmount = typeof swapData.from_amount === 'string' ? parseFloat(swapData.from_amount) : swapData.from_amount;
  const expectedFETAmount = exchangeRate ? Number(exchangeRate) * ethAmount : ethAmount * 1000; // 1000:1 rate

  const handleSwap = async () => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      setTxStatus('error');
      return;
    }

    // Check if we're on the right network
    if (chain?.id !== sepolia.id) {
      try {
        setTxStatus('preparing');
        await switchChain({ chainId: sepolia.id });
      } catch (err: any) {
        setErrorMessage(`Please switch to Sepolia network: ${err.message}`);
        setTxStatus('error');
        return;
      }
    }

    try {
      setTxStatus('pending');
      setErrorMessage('');

      // Call the swap function with ETH amount
      const ethAmount = typeof swapData.from_amount === 'string' ? swapData.from_amount : swapData.from_amount.toString();
      writeContract({
        address: SIMPLE_SWAP_ADDRESS,
        abi: SIMPLE_SWAP_ABI,
        functionName: 'swapETHforFET',
        value: parseEther(ethAmount),
      });
    } catch (err: any) {
      console.error('Swap error:', err);
      setErrorMessage(err.message || 'Swap failed');
      setTxStatus('error');
    }
  };

  // Update status based on transaction state
  if (isConfirming && txStatus !== 'success') {
    if (txStatus !== 'pending') setTxStatus('pending');
  }

  if (isConfirmed && txStatus !== 'success') {
    setTxStatus('success');
  }

  // Success state
  if (txStatus === 'success') {
    return (
      <div className="mt-4 p-4 bg-green-500/10 border-2 border-green-500 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-bold text-green-500">Swap Successful!</span>
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          You received approximately {expectedFETAmount.toFixed(2)} FET
        </div>
        {hash && (
          <div className="text-xs text-muted-foreground break-all">
            Transaction: <span className="font-mono">{hash}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-background border-2 border-primary rounded-lg space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span className="text-sm font-bold text-primary">Swap Preview</span>
      </div>

      {/* From Token */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">From</label>
        <div className="flex items-center justify-between p-3 bg-card border border-border rounded">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{swapData.from_token}</span>
            </div>
            <div>
              <div className="text-sm font-medium">{swapData.from_token_name}</div>
              <div className="text-xs text-muted-foreground">{swapData.from_token}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{typeof swapData.from_amount === 'string' ? swapData.from_amount : swapData.from_amount.toString()}</div>
          </div>
        </div>
      </div>

      {/* Arrow Down */}
      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* To Token */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">To (Estimated)</label>
        <div className="flex items-center justify-between p-3 bg-card border border-border rounded">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{swapData.to_token}</span>
            </div>
            <div>
              <div className="text-sm font-medium">{swapData.to_token_name}</div>
              <div className="text-xs text-muted-foreground">{swapData.to_token}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">{expectedFETAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="pt-2 space-y-1 border-t border-border">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Exchange Rate</span>
          <span className="font-medium">1 ETH = {exchangeRate ? Number(exchangeRate) : '1000'} FET</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Network</span>
          <span className="font-medium">Ethereum Sepolia (Testnet)</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500 rounded text-xs text-red-500">
          {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSwap}
          disabled={!isConnected || isPending || isConfirming || txStatus === 'pending'}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {txStatus === 'pending' ? 'Processing...' : txStatus === 'preparing' ? 'Preparing...' : 'Swap'}
        </button>
      </div>
    </div>
  );
}
