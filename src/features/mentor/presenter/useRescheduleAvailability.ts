// src/hooks/useRescheduleAvailability.ts
import { useState, useEffect, useCallback } from "react";
import * as availabilityApi from "@/features/mentor/model/availability.api";
import type { SessionDuration, PublicSpecificDate } from "@/features/mentor/model/availability.types";

interface UseRescheduleAvailabilityReturn {
    availability: PublicSpecificDate[];
    sessionDurations: SessionDuration[];
    availLoading: boolean;
    availError: string | null;
}

// ── Fetches a mentor's availability for rescheduling a specific session ──
export const useRescheduleAvailability = (
    connectRequestId: string | undefined,
    duration: number,
): UseRescheduleAvailabilityReturn => {
    const [availability, setAvailability] = useState<PublicSpecificDate[]>([]);
    const [sessionDurations, setSessionDurations] = useState<SessionDuration[]>([30, 60]);
    const [availLoading, setAvailLoading] = useState<boolean>(true);
    const [availError, setAvailError] = useState<string | null>(null);

    const fetchAvailability = useCallback(
        async (dur: number) => {
            try {
                setAvailLoading(true);
                setAvailError(null);
                const data = await availabilityApi.getMentorAvailabilityForReschedule(connectRequestId ?? "", dur);
                setAvailability((data.slots as PublicSpecificDate[]) || []);
                if (data.sessionDurations?.length)
                    setSessionDurations(data.sessionDurations);
            } catch (err: unknown) {
                const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                setAvailError(message || "Failed to load availability.");
            } finally {
                setAvailLoading(false);
            }
        },
        [connectRequestId],
    );

    useEffect(() => {
        fetchAvailability(duration);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    return { availability, sessionDurations, availLoading, availError };
};