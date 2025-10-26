import {UserAsset} from "@avail-project/nexus-core";
import {Loader2} from "lucide-react";
import React, {useEffect, useState} from "react";
import {useNexus} from "./providers/NexusProvider";
export default function NexusUnifiedBalance() {
    const [unifiedBalance, setUnifiedBalance] = useState<UserAsset[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const {nexusSDK} = useNexus();
    async function fetchUnifiedBalance() {
        setIsLoading(true);
        try {
            const balance = await nexusSDK?.getUnifiedBalances();
            console.log("Unified Balance:", balance);
            setUnifiedBalance(balance);
        } catch (error) {
            console.error("Error fetching unified balance:", error);
        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        fetchUnifiedBalance();
    }, []);
    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4 text-center flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }
    return (
        <div>
            <h1>Unified Balance: </h1>
            <div>{unifiedBalance?.reduce((acc, fiat) => acc + fiat.balanceInFiat, 0).toFixed(2)}</div>
        </div>
    );
}
