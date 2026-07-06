// src/hooks/useMenteeHomeData.js
import { useState, useEffect } from "react";
import { searchMentors } from "../api/mentorSearch.api";
import { getMyRequests } from "../api/connectRequests.api";
import { getWallet } from "../api/escrow.api";
import logger from "../utils/logger";

// ── Fetches recommended mentors + upcoming sessions + wallet balance ──
export const useMenteeHomeData = (profile) => {
    const [mentors, setMentors] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [escrow, setEscrow] = useState(0);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);

                const skillTerm =
                    profile?.skills?.[0] || profile?.interestedFields?.[0] || "";

                // ── Fire all three independent requests in parallel ──
                // Promise.allSettled so one failing call doesn't wipe out
                // data the other two successfully fetched.
                const [mentorResult, sessionResult, walletResult] = await Promise.allSettled([
                    searchMentors({ skill: skillTerm, limit: 4 }),
                    getMyRequests(),
                    getWallet(),
                ]);

                if (mentorResult.status === "fulfilled") {
                    setMentors(mentorResult.value.mentors || []);
                } else {
                    logger.error("Mentor search fetch failed", { message: mentorResult.reason?.message });
                }

                if (sessionResult.status === "fulfilled") {
                    const allRequests = sessionResult.value.requests || [];
                    const upcoming = allRequests
                        .filter((r) => r.status === "accepted" || r.status === "ongoing")
                        .sort((a, b) => {
                            if (a.status === "ongoing" && b.status !== "ongoing") return -1;
                            if (a.status !== "ongoing" && b.status === "ongoing") return 1;
                            return 0;
                        });
                    setSessions(upcoming);
                } else {
                    logger.error("Sessions fetch failed", { message: sessionResult.reason?.message });
                }

                if (walletResult.status === "fulfilled") {
                    setBalance(walletResult.value.balance ?? 0);
                    setEscrow(walletResult.value.escrow ?? 0);
                } else {
                    logger.error("Wallet fetch failed", { message: walletResult.reason?.message });
                }
            } finally {
                setLoading(false);
            }
        };

        if (profile !== null) fetchAll();
    }, [profile]);

    return { mentors, sessions, loading, balance, escrow };
};