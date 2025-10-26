/**
 * Use this component to only initialize Nexus when required or with a button click
 * Remove the use effect in @NexusProvider to stop auto init process
 */

import {useAccount} from "wagmi";
import {Button} from "./ui/button";
import {ClockFading} from "lucide-react";
import {useState} from "react";
import {useNexus} from "./providers/NexusProvider";

const NexusInitButton = () => {
    const {status} = useAccount();
    const {handleInit, nexusSDK} = useNexus();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInitWithLoading = async () => {
        setLoading(true);
        try {
            await handleInit();
        } catch (err) {
            // allow the UI to show a brief message
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    if (status === "connected" && !nexusSDK?.isInitialized()) {
        return (
            <div className="flex flex-col items-center gap-2">
                <Button onClick={handleInitWithLoading}>
                    {loading ? (
                        <ClockFading className="animate-spin size-5 text-primary-foreground" />
                    ) : (
                        "Connect Nexus"
                    )}
                </Button>
                {error && <p className="text-sm text-red-500">Error initializing Nexus: {error}</p>}
            </div>
        );
    }

    return null;
};

export default NexusInitButton;
