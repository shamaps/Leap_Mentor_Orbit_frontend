// src/hooks/useMentorSlots.ts
import { useState, useEffect, useCallback } from "react";
import { getMentorSlots } from "@/features/mentor/model/availability.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";
import type { SessionDuration, PublicSpecificDate } from "@/features/mentor/model/availability.types";

interface UseMentorSlotsReturn {
    groupedSlots: PublicSpecificDate[];
    availableDurations: SessionDuration[];
    fetchingSlots: boolean;
    slotsError: string;
    fetchSlots: (duration: number) => Promise<void>;
}

// ── Fetches a mentor's available slots for a given session duration ──
export const useMentorSlots = (
    mentorUserId: string | undefined,
    selectedDuration: number,
    setSelectedDuration: (duration: SessionDuration) => void,
): UseMentorSlotsReturn => {
    const [groupedSlots, setGroupedSlots] = useState<PublicSpecificDate[]>([]);
    const [availableDurations, setAvailableDurations] = useState<SessionDuration[]>([60]);
    const [fetchingSlots, setFetchingSlots] = useState<boolean>(true);
    const [slotsError, setSlotsError] = useState<string>("");

    const fetchSlots = useCallback(
        async (duration: number) => {
            try {
                setFetchingSlots(true);
                setSlotsError("");
                const res = await getMentorSlots(mentorUserId ?? "", duration);
                setGroupedSlots((res.slots as PublicSpecificDate[]) || []);
                if (res.sessionDurations?.length) {
                    setAvailableDurations(res.sessionDurations);
                    if (!res.sessionDurations.includes(duration as SessionDuration)) {
                        setSelectedDuration(res.sessionDurations[0]);
                    }
                }
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                setSlotsError(
                    status === HTTP_STATUS.NOT_FOUND
                        ? "This mentor hasn't set their availability yet."
                        : getErrorMessage(err, "Failed to load available slots."),
                );
                setGroupedSlots([]);
            } finally {
                setFetchingSlots(false);
            }
        },
        [mentorUserId, setSelectedDuration],
    );

    useEffect(() => {
        if (!mentorUserId) return;
        fetchSlots(selectedDuration);
    }, [mentorUserId, selectedDuration]);

    return {
        groupedSlots,
        availableDurations,
        fetchingSlots,
        slotsError,
        fetchSlots,
    };
};