"use client";

import React, {useState} from "react";
import {ArrowUpRight, ArrowDownLeft, TrendingUp, Zap, Lock, DollarSign, Loader2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useAccount} from "wagmi";
import {useVaultData} from "@/lib/hooks/useVaultData";

export default function VaultPage() {
    const {address} = useAccount();
    const vaultData = useVaultData();
    const [activeTab, setActiveTab] = useState<"deposit" | "redeem">("deposit");
    const [depositAmount, setDepositAmount] = useState("");
    const [redeemAmount, setRedeemAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleDeposit = async () => {
        setIsLoading(true);
        try {
            // TODO: Call vault contract deposit function
            console.log("Depositing:", depositAmount);
            // await vault.deposit(depositAmount)
            setDepositAmount("");
        } catch (error) {
            console.error("Deposit failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async () => {
        setIsLoading(true);
        try {
            // TODO: Call vault contract redeem function
            console.log("Redeeming:", redeemAmount);
            // await vault.redeem(redeemAmount)
            setRedeemAmount("");
        } catch (error) {
            console.error("Redeem failed:", error);
        } finally {
            setIsLoading(false);
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

                                    <Button
                                        onClick={handleDeposit}
                                        disabled={!depositAmount || isLoading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all"
                                    >
                                        {isLoading ? "Processing..." : "Deposit Now"}
                                    </Button>
                                </div>
                            )}

                            {/* Redeem Tab */}
                            {activeTab === "redeem" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Amount to Redeem
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={redeemAmount}
                                                onChange={(e) => setRedeemAmount(e.target.value)}
                                                placeholder="Enter amount"
                                                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                                            />
                                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 text-sm font-medium">
                                                MAX
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-700/30 rounded-lg p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-300">You'll receive</span>
                                            <span className="text-white font-medium">
                                                ${(parseFloat(redeemAmount) * 1.05).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Including yield</span>
                                            <span className="text-green-400 text-sm">
                                                +${(parseFloat(redeemAmount) * 0.05).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRedeem}
                                        disabled={!redeemAmount || isLoading}
                                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all"
                                    >
                                        {isLoading ? "Processing..." : "Redeem Now"}
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
            </div>
        </div>
    );
}
