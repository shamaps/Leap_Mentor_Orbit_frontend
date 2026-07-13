// src/hooks/useRescheduleAvailability.js
import { useState, useEffect, useCallback } from "react";
import * as availabilityApi from "../api/availability.api";

// ── Fetches a mentor's availability for rescheduling a specific session ──
export const useRescheduleAvailability = (connectRequestId, duration) => {
    const [availability, setAvailability] = useState([]);
    const [sessionDurations, setSessionDurations] = useState([30, 60]);
    const [availLoading, setAvailLoading] = useState(true);
    const [availError, setAvailError] = useState(null);

    const fetchAvailability = useCallback(
        async (dur) => {
            try {
                setAvailLoading(true);
                setAvailError(null);
                const data = await availabilityApi.getMentorAvailabilityForReschedule(connectRequestId, dur);
                setAvailability(data.slots || []);
                if (data.sessionDurations?.length)
                    setSessionDurations(data.sessionDurations);
            } catch (err) {
                setAvailError(
                    err?.response?.data?.message || "Failed to load availability.",
                );
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