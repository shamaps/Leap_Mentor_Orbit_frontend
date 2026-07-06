// src/hooks/useEscrowStatus.js
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import logger from "../utils/logger";

// ── Fetches wallet balance + commission rate for a connect request's escrow ──
export const useEscrowStatus = (connectId) => {
    const [fetching, setFetching] = useState(true);
    const [walletBalance, setWalletBalance] = useState(null);
    const [commissionRate, setCommissionRate] = useState(20);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                setFetching(true);
                const res = await axiosInstance.get(`/escrow/status/${connectId}`);
                setWalletBalance(res.data?.wallet?.balance ?? null);
                if (res.data?.commissionRate != null)
                    setCommissionRate(res.data.commissionRate);
            } catch (err) {
                logger.warn("Could not fetch escrow status", { message: err.message });
            } finally {
                setFetching(false);
            }
        };
        if (connectId) fetchWallet();
    }, [connectId]);

    return { fetching, walletBalance, commissionRate };
};