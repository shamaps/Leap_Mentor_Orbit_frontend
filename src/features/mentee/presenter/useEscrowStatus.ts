// src/hooks/useEscrowStatus.js
import { useState, useEffect } from "react";
import { getEscrowStatusForConnect } from "@/features/mentee/model/menteeEngagement.api";
import logger from "@/shared/utils/logger";

// ── Fetches wallet balance + commission rate for a connect request's escrow ──
export const useEscrowStatus = (connectId?: string) => {
    const [fetching, setFetching] = useState(true);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [commissionRate, setCommissionRate] = useState(20);

    useEffect(() => {
        const fetchWallet = async (id: string) => {
            try {
                setFetching(true);
                const res = await getEscrowStatusForConnect(id);
                setWalletBalance(res.data?.wallet?.balance ?? null);
                if (res.data?.commissionRate != null)
                    setCommissionRate(res.data.commissionRate);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                logger.warn("Could not fetch escrow status", { message });
            } finally {
                setFetching(false);
            }
        };
        if (connectId) fetchWallet(connectId);
    }, [connectId]);

    return { fetching, walletBalance, commissionRate };
};