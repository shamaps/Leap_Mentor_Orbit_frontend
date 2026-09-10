// src/hooks/useMentorSlots.js
import { useState, useEffect, useCallback } from "react";
import { getMentorSlots } from "@/features/mentor/model/availability.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";

// ── Fetches a mentor's available slots for a given session duration ──
export const useMentorSlots = (mentorUserId, selectedDuration, setSelectedDuration) => {
    const [groupedSlots, setGroupedSlots] = useState([]);
    const [availableDurations, setAvailableDurations] = useState([60]);
    const [fetchingSlots, setFetchingSlots] = useState(true);
    const [slotsError, setSlotsError] = useState("");

    const fetchSlots = useCallback(
        async (duration) => {
            try {
                setFetchingSlots(true);
                setSlotsError("");
                const res = await getMentorSlots(mentorUserId, duration);
                setGroupedSlots(res.slots || []);
                if (res.sessionDurations?.length) {
                    setAvailableDurations(res.sessionDurations);
                    if (!res.sessionDurations.includes(duration)) {
                        setSelectedDuration(res.sessionDurations[0]);
                    }
                }
            } catch (err) {
                setSlotsError(
                    err?.response?.status === HTTP_STATUS.NOT_FOUND
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