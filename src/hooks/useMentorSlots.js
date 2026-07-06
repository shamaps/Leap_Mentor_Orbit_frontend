// src/hooks/useMentorSlots.js
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import getErrorMessage from "../utils/getErrorMessage";
import { HTTP_STATUS } from "../constants/httpStatus";

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
                const res = await axiosInstance.get(
                    `/availability/${mentorUserId}/slots?duration=${duration}`,
                );
                setGroupedSlots(res.data.slots || []);
                if (res.data.sessionDurations?.length) {
                    setAvailableDurations(res.data.sessionDurations);
                    if (!res.data.sessionDurations.includes(duration)) {
                        setSelectedDuration(res.data.sessionDurations[0]);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mentorUserId, selectedDuration]);

    return {
        groupedSlots,
        availableDurations,
        fetchingSlots,
        slotsError,
        fetchSlots,
    };
};