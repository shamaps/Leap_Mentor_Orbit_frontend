// src/hooks/useMenteeHomeData.js
import { useState, useEffect } from "react";
import { searchMentors } from "@/features/mentee/model/mentorSearch.api";
import { getMyRequests } from "@/features/connects/model/connectRequests.api";
import { getWallet } from "@/features/shared-dashboard/model/escrow.api";
import logger from "@/shared/utils/logger";

// ── Fetches recommended mentors + upcoming sessions + wallet balance 
export const useMenteeHomeData = (profile) => {
    const [mentors, setMentors] = useState([]);
    const [loadingMentors, setLoadingMentors] = useState(true);

    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    const [balance, setBalance] = useState(0);
    const [escrow, setEscrow] = useState(0);
    const [loadingWallet, setLoadingWallet] = useState(true);

    useEffect(() => {
        const skillTerm =
            profile?.skills?.[0] || profile?.interestedFields?.[0] || "";

        const fetchMentors = async () => {
            try {
                setLoadingMentors(true);
                const data = await searchMentors({ skill: skillTerm, limit: 4 });
                setMentors(data.mentors || []);
            } catch (err) {
                logger.error("Mentor search fetch failed", { message: err?.message });
            } finally {
                setLoadingMentors(false);
            }
        };

        const fetchSessions = async () => {
            try {
                setLoadingSessions(true);
                const data = await getMyRequests();
                const upcoming = (data.requests || [])
                    .filter((r) => r.status === "accepted" || r.status === "ongoing")
                    .sort((a, b) => {
                        if (a.status === "ongoing" && b.status !== "ongoing") return -1;
                        if (a.status !== "ongoing" && b.status === "ongoing") return 1;
                        return 0;
                    });
                setSessions(upcoming);
            } catch (err) {
                logger.error("Sessions fetch failed", { message: err?.message });
            } finally {
                setLoadingSessions(false);
            }
        };

        const fetchWallet = async () => {
            try {
                setLoadingWallet(true);
                const data = await getWallet();
                setBalance(data.balance ?? 0);
                setEscrow(data.escrow ?? 0);
            } catch (err) {
                logger.error("Wallet fetch failed", { message: err?.message });
            } finally {
                setLoadingWallet(false);
            }
        };

        if (profile !== null) {
            fetchMentors();
            fetchSessions();
            fetchWallet();
        }
    }, [profile]);

    return {
        mentors, loadingMentors,
        sessions, loadingSessions,
        balance, escrow, loadingWallet,
    };
};