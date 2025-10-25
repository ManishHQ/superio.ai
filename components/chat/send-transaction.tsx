'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain, useEstimateGas, useGasPrice } from 'wagmi';
import { parseEther, formatEther, formatGwei } from 'viem';
import { sepolia } from 'wagmi/chains';
import { SendUI } from './message';

interface SendTransactionProps {
  sendData: SendUI;
}

export function SendTransaction({ sendData }: SendTransactionProps) {
  const { address, isConnected, chain } = useAccount();
  const { sendTransaction, data: hash, error, isPending } = useSendTransaction();
  const { switchChain } = useSwitchChain();
  const [txStatus, setTxStatus] = useState<'idle' | 'preparing' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Editable fields
  const [amount, setAmount] = useState<string>(sendData.amount.toString());
  const [toAddress, setToAddress] = useState<string>(sendData.to_address);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Gas estimation
  const { data: gasEstimate } = useEstimateGas({
    to: toAddress as `0x${string}`,
    value: amount ? parseEther(amount) : undefined,
    account: address,
  });

  const { data: gasPrice } = useGasPrice();

  // Calculate gas fee in ETH
  const gasFeeETH = gasEstimate && gasPrice
    ? formatEther(gasEstimate * gasPrice)
    : null;

  const gasPriceGwei = gasPrice ? formatGwei(gasPrice) : null;

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSend = async () => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      setTxStatus('error');
      return;
    }

    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setTxStatus('error');
      return;
    }

    if (!toAddress || !toAddress.startsWith('0x') || toAddress.length !== 42) {
      setErrorMessage('Please enter a valid Ethereum address');
      setTxStatus('error');
      return;
    }

    // Check if we're on the right network (Sepolia for now)
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

      // For now, we only support ETH on Sepolia
      if (sendData.token.toUpperCase() !== 'ETH') {
        throw new Error('Only ETH transfers are currently supported');
      }

      sendTransaction({
        to: toAddress as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (err: any) {
      console.error('Transaction error:', err);
      setErrorMessage(err.message || 'Transaction failed');
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
  if (error && txStatus !== 'error') {
    setTxStatus('error');
    setErrorMessage(error.message);
  }

  return (
    <div className="mt-4 p-4 bg-background border-2 border-green-500 rounded-lg space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span className="text-sm font-bold text-green-500">Send Transaction</span>
      </div>

      {/* Token & Amount */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Amount</label>
        <div className="flex items-center gap-2 p-3 bg-card border border-border rounded">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-green-500">{sendData.token}</span>
            </div>
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending || isConfirming || txStatus === 'success'}
              className="flex-1 bg-transparent text-lg font-bold text-green-500 outline-none disabled:opacity-50"
              placeholder="0.0"
            />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{sendData.token_name}</div>
            <div className="text-xs text-muted-foreground">{sendData.network}</div>
          </div>
        </div>
      </div>

      {/* Recipient Address */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">To Address</label>
        <div className="p-3 bg-card border border-border rounded">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              disabled={isPending || isConfirming || txStatus === 'success'}
              className="flex-1 bg-transparent text-xs font-mono outline-none disabled:opacity-50"
              placeholder="0x..."
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="pt-2 space-y-1 border-t border-border">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Network</span>
          <span className="font-medium">{sendData.network}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Gas Price</span>
          <span className="font-medium">
            {gasPriceGwei ? `${parseFloat(gasPriceGwei).toFixed(2)} Gwei` : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Gas Limit</span>
          <span className="font-medium">
            {gasEstimate ? gasEstimate.toString() : 'Estimating...'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Estimated Gas Fee</span>
          <span className="font-medium">
            {gasFeeETH ? `${parseFloat(gasFeeETH).toFixed(6)} ETH` : 'Calculating...'}
          </span>
        </div>
        <div className="flex justify-between text-xs font-semibold pt-1 border-t border-border">
          <span className="text-muted-foreground">Total Cost</span>
          <span className="text-foreground">
            {gasFeeETH && amount
              ? `${(parseFloat(amount) + parseFloat(gasFeeETH)).toFixed(6)} ETH`
              : 'Calculating...'}
          </span>
        </div>
      </div>

      {/* Transaction Status */}
      {txStatus !== 'idle' && (
        <div className={`p-3 rounded text-sm ${
          txStatus === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500' :
          txStatus === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500' :
          'bg-blue-500/10 text-blue-500 border border-blue-500'
        }`}>
          {txStatus === 'preparing' && '🔄 Switching to Sepolia network...'}
          {txStatus === 'pending' && !hash && '⏳ Waiting for wallet confirmation...'}
          {txStatus === 'pending' && hash && (
            <>
              ⏳ Transaction submitted! Hash:{' '}
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-mono"
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </a>
            </>
          )}
          {txStatus === 'success' && (
            <>
              ✅ Transaction confirmed!{' '}
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on Etherscan
              </a>
            </>
          )}
          {txStatus === 'error' && `❌ ${errorMessage}`}
        </div>
      )}

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="p-3 bg-yellow-500/10 text-yellow-600 border border-yellow-500 rounded text-sm">
          ⚠️ Please connect your wallet to sign this transaction
        </div>
      )}

      {/* Network Warning */}
      {isConnected && chain?.id !== sepolia.id && txStatus === 'idle' && (
        <div className="p-3 bg-yellow-500/10 text-yellow-600 border border-yellow-500 rounded text-sm">
          ⚠️ You are on {chain?.name}. Transaction will switch to Sepolia network.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSend}
          disabled={!isConnected || isPending || isConfirming || txStatus === 'success'}
          className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isConnected ? 'Connect Wallet' :
           isPending || isConfirming ? 'Signing...' :
           txStatus === 'success' ? 'Sent ✓' :
           'Sign Transaction'}
        </button>
        <button
          onClick={() => {/* Do nothing - just dismiss */}}
          disabled={isPending || isConfirming}
          className="px-4 py-2 border border-border text-foreground font-medium rounded hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
