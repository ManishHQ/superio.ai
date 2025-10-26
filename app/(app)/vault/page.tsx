"use client";

import React, {useState} from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Zap,
    Lock,
    DollarSign,
    Loader2,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useAccount, useWriteContract, useReadContract} from "wagmi";
import {useVaultData} from "@/lib/hooks/useVaultData";
import {VAULT_ADDRESS, MOCK_TOKEN_ADDRESS} from "@/lib/contracts";
import {VAULT_ABI} from "@/lib/abis/vault-abi";
import {MOCK_TOKEN_ABI} from "@/lib/abis/token-abi";
import {parseUnits} from "viem";

export default function VaultPage() {
    const {address} = useAccount();
    const vaultData = useVaultData();
    const [activeTab, setActiveTab] = useState<"deposit" | "redeem">("deposit");
    const [depositAmount, setDepositAmount] = useState("");
    const [redeemAmount, setRedeemAmount] = useState("");
    const [txStatus, setTxStatus] = useState<"idle" | "approving" | "depositing" | "withdrawing" | "success" | "error">(
        "idle"
    );
    const [txMessage, setTxMessage] = useState("");
    const [txHash, setTxHash] = useState<string>("");

    // Deposit logs state
    const [depositLogs, setDepositLogs] = useState<
        Array<{
            txHash: string;
            amount: string;
            timestamp: number;
            status: "success" | "error";
        }>
    >([
        {
            txHash: "0x7a4f8b2c5d9e1f3a8c7b6e4d2f9a1c3e",
            amount: "10",
            timestamp: Date.now() - 7200000, // 2 hours ago
            status: "success",
        },
        {
            txHash: "0x3c1e9f7a2b5d8e1f4a7c6b3e9d2f5a8c",
            amount: "25",
            timestamp: Date.now() - 86400000, // 1 day ago
            status: "success",
        },
        {
            txHash: "0x5d2b4e8f1a9c7e3f2d6b8a4c5e9f1d3b",
            amount: "50",
            timestamp: Date.now() - 432000000, // 5 days ago
            status: "success",
        },
    ]);

    // Get token decimals
    const {data: tokenDecimals} = useReadContract({
        address: MOCK_TOKEN_ADDRESS,
        abi: [
            {
                type: "function",
                name: "decimals",
                inputs: [],
                outputs: [{name: "", type: "uint8", internalType: "uint8"}],
                stateMutability: "view",
            },
        ],
        functionName: "decimals",
    });

    // Get current allowance
    const {data: currentAllowance, refetch: refetchAllowance} = useReadContract({
        address: "0x104Bc7F7E441A01dCDA73cA16Fb40399D9C97E53" as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: "allowance",
        args: [address || "0x0", VAULT_ADDRESS],
        query: {
            enabled: !!address,
        },
    });

    // Get user token balance
    const {data: userTokenBalance} = useReadContract({
        address: MOCK_TOKEN_ADDRESS,
        abi: MOCK_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address || "0x0"],
        query: {
            enabled: !!address,
        },
    });

    const {writeContractAsync: approveToken} = useWriteContract();
    const {writeContractAsync: depositToVault} = useWriteContract();
    const {writeContractAsync: redeemFromVault} = useWriteContract();

    const handleDeposit = async () => {
        console.log("Token Decimals: ", tokenDecimals);
        if (!address || !depositAmount || !tokenDecimals || parseFloat(depositAmount) <= 0) {
            setTxStatus("error");
            setTxMessage("Please connect wallet and enter a valid amount");
            return;
        }

        try {
            const amountInWei = parseUnits(depositAmount, tokenDecimals);

            // Check allowance
            if (!currentAllowance || currentAllowance < amountInWei) {
                setTxStatus("approving");
                setTxMessage("Approving token spend...");

                // Request approval
                const approveTx = await approveToken({
                    address: MOCK_TOKEN_ADDRESS,
                    abi: MOCK_TOKEN_ABI,
                    functionName: "approve",
                    args: [VAULT_ADDRESS, amountInWei],
                });

                setTxHash(approveTx);
                await refetchAllowance();
            }

            // Deposit
            setTxStatus("depositing");
            setTxMessage("Depositing to vault...");

            const depositTx = await depositToVault({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: "deposit",
                args: [amountInWei, address],
                gas: BigInt(500000),
            });

            setTxHash(depositTx);
            setTxStatus("success");
            setTxMessage(`Deposit successful! Tx: ${depositTx.slice(0, 10)}...`);

            // Add to deposit logs
            setDepositLogs((prev) => [
                {
                    txHash: depositTx,
                    amount: depositAmount,
                    timestamp: Date.now(),
                    status: "success",
                },
                ...prev,
            ]);

            setDepositAmount("");
        } catch (error) {
            console.error("Deposit error:", error);
            setTxStatus("error");
            setTxMessage(error instanceof Error ? error.message : "Deposit failed");

            // Add failed deposit to logs if txHash exists
            if (txHash) {
                setDepositLogs((prev) => [
                    ...prev,
                    {
                        txHash: txHash,
                        amount: depositAmount,
                        timestamp: Date.now(),
                        status: "error",
                    },
                ]);
            }
        }
    };

    const handleWithdrawAll = async () => {
        if (!address || !vaultData.userBalance) {
            setTxStatus("error");
            setTxMessage("No shares to redeem");
            return;
        }

        try {
            setTxStatus("withdrawing");
            setTxMessage("Withdrawing all shares...");

            const withdrawTx = await redeemFromVault({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: "redeem",
                args: [vaultData.userBalance, address, address],
            });

            setTxHash(withdrawTx);
            setTxStatus("success");
            setTxMessage(`Withdrawal successful! Tx: ${withdrawTx.slice(0, 10)}...`);
            setRedeemAmount("");

            // Refresh data
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error("Withdraw error:", error);
            setTxStatus("error");
            setTxMessage(error instanceof Error ? error.message : "Withdrawal failed");
        }
    };

    if (!address) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="text-center">
                    <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                    <p className="text-slate-300">Please connect your wallet to access the vault</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Yield Vault</h1>
                    <p className="text-purple-300">Deposit assets and earn yield from multiple strategies</p>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Total Assets Card */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-300 text-sm font-medium">Total Assets</span>
                            <DollarSign className="w-4 h-4 text-blue-400" />
                        </div>
                        {vaultData.isLoading ? (
                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                        ) : (
                            <p className="text-2xl font-bold text-white">
                                ${(Number(vaultData.totalAssets) / 1e18).toFixed(2)}
                            </p>
                        )}
                        <p className="text-blue-300 text-xs mt-2">Across all strategies</p>
                    </div>

                    {/* Your Balance Card */}
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-300 text-sm font-medium">Your Balance</span>
                            <Lock className="w-4 h-4 text-purple-400" />
                        </div>
                        {vaultData.isLoading ? (
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-white">${vaultData.userBalanceUSD.toFixed(2)}</p>
                                <p className="text-purple-300 text-xs mt-2">
                                    {(Number(vaultData.userBalance) / 1e18).toFixed(2)} shares
                                </p>
                            </>
                        )}
                    </div>

                    {/* Total Yield Card */}
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-300 text-sm font-medium">Total Yield</span>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        {vaultData.isLoading ? (
                            <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                        ) : (
                            <p className="text-2xl font-bold text-white">${vaultData.totalYieldEarned.toFixed(2)}</p>
                        )}
                        <p className="text-green-300 text-xs mt-2">Earned so far</p>
                    </div>

                    {/* APY Card */}
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-orange-300 text-sm font-medium">Current APY</span>
                            <Zap className="w-4 h-4 text-orange-400" />
                        </div>
                        <p className="text-2xl font-bold text-white">{vaultData.apy.toFixed(2)}%</p>
                        <p className="text-orange-300 text-xs mt-2">Annual yield rate</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Deposit/Redeem Card */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setActiveTab("deposit")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        activeTab === "deposit"
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                                    }`}
                                >
                                    <ArrowDownLeft className="w-4 h-4" />
                                    Deposit
                                </button>
                                <button
                                    onClick={() => setActiveTab("redeem")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        activeTab === "redeem"
                                            ? "bg-purple-600 text-white shadow-lg"
                                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                                    }`}
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                    Redeem
                                </button>
                            </div>

                            {/* Deposit Tab */}
                            {activeTab === "deposit" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Amount to Deposit
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                placeholder="Enter amount in ETH"
                                                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 text-sm font-medium">
                                                MAX
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-700/30 rounded-lg p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-300">You'll receive</span>
                                            <span className="text-white font-medium">
                                                {depositAmount ? (parseFloat(depositAmount) * 0.95).toFixed(2) : "0"}{" "}
                                                shares
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Exchange rate</span>
                                            <span className="text-slate-400 text-sm">1 share = ~$1.05</span>
                                        </div>
                                    </div>

                                    {/* Transaction Status */}
                                    {txStatus !== "idle" && (
                                        <div
                                            className={`rounded-lg p-4 flex items-center gap-3 ${
                                                txStatus === "success"
                                                    ? "bg-green-500/20 border border-green-500/30"
                                                    : txStatus === "error"
                                                    ? "bg-red-500/20 border border-red-500/30"
                                                    : "bg-blue-500/20 border border-blue-500/30"
                                            }`}
                                        >
                                            {txStatus === "success" ? (
                                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                            ) : txStatus === "error" ? (
                                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            ) : (
                                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                                            )}
                                            <div className="flex-1 overflow-hidden">
                                                <p
                                                    className={`text-sm ${
                                                        txStatus === "success"
                                                            ? "text-green-300"
                                                            : txStatus === "error"
                                                            ? "text-red-300"
                                                            : "text-blue-300"
                                                    }`}
                                                >
                                                    {txMessage}
                                                </p>
                                                {txHash && (
                                                    <a
                                                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 block"
                                                    >
                                                        View on Etherscan →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleDeposit}
                                        disabled={
                                            !depositAmount || txStatus === "approving" || txStatus === "depositing"
                                        }
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all"
                                    >
                                        {txStatus === "approving" || txStatus === "depositing" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                                                {txStatus === "approving" ? "Approving..." : "Depositing..."}
                                            </>
                                        ) : (
                                            "Deposit Now"
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Redeem Tab */}
                            {activeTab === "redeem" && (
                                <div className="space-y-4">
                                    <div className="bg-slate-700/30 rounded-lg p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-300">Your Vault Shares</span>
                                            <span className="text-white font-medium">
                                                {(Number(vaultData.userBalance) / 1e18).toFixed(2)} shares
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">USD Value</span>
                                            <span className="text-white font-medium">
                                                ${vaultData.userBalanceUSD.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-700/30 rounded-lg p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-300">You'll receive</span>
                                            <span className="text-white font-medium">
                                                ${vaultData.userBalanceUSD.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Estimated yield</span>
                                            <span className="text-green-400 text-sm">
                                                +$
                                                {(
                                                    vaultData.totalYieldEarned *
                                                    (vaultData.userBalanceUSD / (Number(vaultData.totalAssets) / 1e18))
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Transaction Status */}
                                    {txStatus !== "idle" && (
                                        <div
                                            className={`rounded-lg p-4 flex items-center gap-3 ${
                                                txStatus === "success"
                                                    ? "bg-green-500/20 border border-green-500/30"
                                                    : txStatus === "error"
                                                    ? "bg-red-500/20 border border-red-500/30"
                                                    : "bg-blue-500/20 border border-blue-500/30"
                                            }`}
                                        >
                                            {txStatus === "success" ? (
                                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                            ) : txStatus === "error" ? (
                                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            ) : (
                                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <p
                                                    className={`text-sm ${
                                                        txStatus === "success"
                                                            ? "text-green-300"
                                                            : txStatus === "error"
                                                            ? "text-red-300"
                                                            : "text-blue-300"
                                                    }`}
                                                >
                                                    {txMessage}
                                                </p>
                                                {txHash && (
                                                    <a
                                                        href={`https://etherscan.io/tx/${txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 block"
                                                    >
                                                        View on Etherscan →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleWithdrawAll}
                                        disabled={!vaultData.userBalance || txStatus === "withdrawing"}
                                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all"
                                    >
                                        {txStatus === "withdrawing" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                                                Withdrawing...
                                            </>
                                        ) : (
                                            "Withdraw All"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Strategies Card */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4">Active Strategies</h3>
                        {vaultData.isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {vaultData.strategies.map((strategy, index) => (
                                    <div
                                        key={index}
                                        className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-white font-medium">{strategy.name}</p>
                                                <p className="text-slate-400 text-xs">
                                                    {strategy.allocation}% allocation
                                                </p>
                                            </div>
                                            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                                                +${strategy.yield.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-600/50 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                                style={{width: `${strategy.allocation}%`}}
                                            />
                                        </div>
                                        <p className="text-slate-400 text-xs mt-2">
                                            ${strategy.deployed.toFixed(2)} deployed
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                    <p className="text-slate-300 text-sm">
                        💡 <span className="font-medium">Pro Tip:</span> Your deposits are automatically deployed across
                        multiple yield strategies. Redeem anytime to withdraw your assets plus any earned yield. Yield
                        is calculated based on your share proportion in the vault.
                    </p>
                </div>

                {/* Activity Logs Section */}
                <div className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-6">Deposit Activity</h3>

                    {depositLogs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400 text-sm">No deposits yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {depositLogs.map((log, index) => (
                                <div
                                    key={index}
                                    className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0 mt-0.5">
                                                <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium">Deposit</p>
                                                <p className="text-slate-400 text-xs mt-1">
                                                    Deposited {log.amount} MOCK tokens to vault
                                                </p>
                                                <p className="text-slate-500 text-xs mt-2 font-mono">
                                                    {log.txHash.slice(0, 10)}...{log.txHash.slice(-8)}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <p className="text-slate-500 text-xs">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </p>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded font-medium ${
                                                            log.status === "success"
                                                                ? "bg-green-500/20 text-green-300"
                                                                : "bg-red-500/20 text-red-300"
                                                        }`}
                                                    >
                                                        {log.status === "success" ? "✓ Success" : "✗ Failed"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <a
                                                href={`https://etherscan.io/tx/${log.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
