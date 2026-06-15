import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";

const useSessions = (connectRequestId, onAllComplete) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSlots, setSavingSlots] = useState(new Set());
  const [error, setError] = useState(null);
  const [completedSlots, setCompletedSlots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0);
  const [progress, setProgress] = useState(0);
  const [allComplete, setAllComplete] = useState(false); // ✅ NEW

  const onAllCompleteRef = useRef(onAllComplete);
  useEffect(() => {
    onAllCompleteRef.current = onAllComplete;
  }, [onAllComplete]);

  const setSavingSlot = (index, val) =>
    setSavingSlots((prev) => {
      const next = new Set(prev);
      val ? next.add(index) : next.delete(index);
      return next;
    });

  // ✅ now also sets allComplete
  const applySlotUpdate = useCallback((data) => {
    if (data.slots) setSlots(data.slots);
    if (data.completedSlots !== undefined) setCompletedSlots(data.completedSlots);
    if (data.totalSlots !== undefined) setTotalSlots(data.totalSlots);
    if (data.progress !== undefined) setProgress(data.progress);
    if (data.allComplete !== undefined) setAllComplete(data.allComplete); // ✅ NEW
  }, []);

  const fetchSlots = useCallback(async (silent = false) => {
    if (!connectRequestId) return;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/sessions/${connectRequestId}/slots`);
      applySlotUpdate(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load sessions.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [connectRequestId, applySlotUpdate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // ✅ Poll every 5s — real-time sync without sockets
  useEffect(() => {
    if (!connectRequestId) return;
    const interval = setInterval(() => fetchSlots(true), 5000);
    return () => clearInterval(interval);
  }, [connectRequestId, fetchSlots]);

  // ✅ Keep socket listeners ONLY for goals (chat uses its own)
  // Session sync is now handled by polling above — socket block removed

  const setMeetingLink = useCallback(
    async (slotIndex, meetingLink) => {
      if (!meetingLink?.trim()) return { success: false };
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const res = await axiosInstance.patch(
          `/sessions/${connectRequestId}/slots/${slotIndex}/meeting-link`,
          { meetingLink }
        );
        setSlots((prev) =>
          prev.map((s, i) =>
            i === slotIndex ? { ...s, meetingLink: res.data.slot.meetingLink } : s,
          ),
        );
        return { success: true };
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to save meeting link.");
        return { success: false, message: err?.response?.data?.message };
      } finally {
        setSavingSlot(slotIndex, false);
      }
    },
    [connectRequestId],
  );

  // ✅ now uses applySlotUpdate so allComplete is set correctly
  const markSlotComplete = useCallback(
    async (slotIndex) => {
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const res = await axiosInstance.patch(
          `/sessions/${connectRequestId}/slots/${slotIndex}/mark-complete`,
          {}
        );
        applySlotUpdate(res.data); // ✅ replaces manual setSlots/setCompletedSlots/setProgress
        return { success: true, ...res.data };
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to mark session complete.");
        return { success: false, message: err?.response?.data?.message };
      } finally {
        setSavingSlot(slotIndex, false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  const addSlot = useCallback(
    async ({ day, date, startTime, endTime }) => {
      try {
        setSavingSlot(-1, true);
        setError(null);
        const res = await axiosInstance.post(
          `/sessions/${connectRequestId}/slots`,
          { day, date, startTime, endTime }
        );
        applySlotUpdate(res.data);
        return { success: true, slotId: res.data.slotId ?? null };
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to add session.";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSavingSlot(-1, false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  const cancelSlot = useCallback(
    async (slotIndex, reason = "") => {
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const res = await axiosInstance.patch(
          `/sessions/${connectRequestId}/slots/${slotIndex}/cancel`,
          { reason }
        );
        applySlotUpdate(res.data);
        return { success: true, ...res.data };
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to cancel slot.";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSavingSlot(slotIndex, false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  const rescheduleSlot = useCallback(
    async (slotIndex, { date, startTime, endTime }) => {
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const res = await axiosInstance.patch(
          `/sessions/${connectRequestId}/slots/${slotIndex}/reschedule`,
          { date, startTime, endTime }
        );
        applySlotUpdate(res.data);
        return { success: true, ...res.data };
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to reschedule slot.";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSavingSlot(slotIndex, false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  return {
    slots,
    loading,
    savingSlots,
    error,
    completedSlots,
    totalSlots,
    progress,
    allComplete, // ✅ NEW
    setMeetingLink,
    markSlotComplete,
    addSlot,
    cancelSlot,
    rescheduleSlot,
    refetch: fetchSlots,
  };
};

export default useSessions;