import { useState, useEffect, useCallback, useRef } from "react";
import * as sessionsApi from "@/features/shared-dashboard/model/sessions.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import type { SessionSlot } from "@/features/shared-dashboard/model/types";

interface SlotUpdateData {
  slots?: SessionSlot[];
  completedSlots?: number;
  totalSlots?: number;
  progress?: number;
  allComplete?: boolean;
  [key: string]: unknown;
}

const useSessions = (connectRequestId: string | undefined, onAllComplete?: () => void) => {
  const [slots, setSlots] = useState<SessionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlots, setSavingSlots] = useState(new Set<number>());
  const [error, setError] = useState<string | null>(null);
  const [completedSlots, setCompletedSlots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0);
  const [progress, setProgress] = useState(0);
  const [allComplete, setAllComplete] = useState(false);
  const onAllCompleteRef = useRef(onAllComplete);
  useEffect(() => {
    onAllCompleteRef.current = onAllComplete;
  }, [onAllComplete]);

  const setSavingSlot = (index: number, val: boolean) =>
    setSavingSlots((prev) => {
      const next = new Set(prev);
      if (val) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });

  // now also sets allComplete
  const applySlotUpdate = useCallback((data: SlotUpdateData) => {
    if (data.slots) setSlots(data.slots);
    if (data.completedSlots !== undefined)
      setCompletedSlots(data.completedSlots);
    if (data.totalSlots !== undefined) setTotalSlots(data.totalSlots);
    if (data.progress !== undefined) setProgress(data.progress);
    if (data.allComplete !== undefined) setAllComplete(data.allComplete);
  }, []);

  const fetchSlots = useCallback(
    async (silent = false) => {
      if (!connectRequestId) return;
      try {
        if (!silent) setLoading(true);
        setError(null);
        const data = await sessionsApi.getSlots(connectRequestId);
        applySlotUpdate(data);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load sessions."));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Poll every 5s — real-time sync without sockets
  useEffect(() => {
    if (!connectRequestId) return undefined;
    const interval = setInterval(() => fetchSlots(true), 10000);
    return () => clearInterval(interval);
  }, [connectRequestId, fetchSlots]);

  //  Keep socket listeners ONLY for goals (chat uses its own)
  // Session sync is now handled by polling above — socket block removed

  const setMeetingLink = useCallback(
    async (slotIndex: number, meetingLink: string) => {
      if (!meetingLink?.trim() || !connectRequestId) return { success: false };
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const data = await sessionsApi.setSlotMeetingLink(connectRequestId, slotIndex, meetingLink);
        setSlots((prev) =>
          prev.map((s, i) =>
            i === slotIndex
              ? { ...s, meetingLink: data.slot.meetingLink }
              : s,
          ),
        );
        return { success: true };
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to save meeting link.");
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSavingSlot(slotIndex, false);
      }
    },
    [connectRequestId],
  );

  //  now uses applySlotUpdate so allComplete is set correctly
  const markSlotComplete = useCallback(
    async (slotIndex: number) => {
      if (!connectRequestId) return { success: false };
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const data = await sessionsApi.markSlotComplete(connectRequestId, slotIndex);
        applySlotUpdate(data); // replaces manual setSlots/setCompletedSlots/setProgress
        return { success: true, ...data };
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to mark session complete.");
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSavingSlot(slotIndex, false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  const addSlot = useCallback(
    async ({
      day,
      date,
      startTime,
      endTime,
    }: {
      day: string;
      date: string;
      startTime: string;
      endTime: string;
    }) => {
      if (!connectRequestId) return { success: false };
      try {
        setSavingSlot(-1, true);
        setError(null);
        const data = await sessionsApi.addSlot(connectRequestId, { day, date, startTime, endTime });
        applySlotUpdate(data);
        return { success: true, slotId: data.slotId ?? null };
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to add session.");
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSavingSlot(-1, false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  const cancelSlot = useCallback(
    async (slotIndex: number, reason = "") => {
      if (!connectRequestId) return { success: false };
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const data = await sessionsApi.cancelSlot(connectRequestId, slotIndex, reason);
        applySlotUpdate(data);
        return { success: true, ...data };
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to cancel slot.");
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSavingSlot(slotIndex, false);
      }
    },
    [connectRequestId, applySlotUpdate],
  );

  const rescheduleSlot = useCallback(
    async (
      slotIndex: number,
      { date, startTime, endTime }: { date: string; startTime: string; endTime: string },
    ) => {
      if (!connectRequestId) return { success: false };
      try {
        setSavingSlot(slotIndex, true);
        setError(null);
        const data = await sessionsApi.rescheduleSlot(connectRequestId, slotIndex, { date, startTime, endTime });
        applySlotUpdate(data);
        return { success: true, ...data };
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to reschedule slot.");
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
    allComplete,
    setMeetingLink,
    markSlotComplete,
    addSlot,
    cancelSlot,
    rescheduleSlot,
    refetch: fetchSlots,
  };
};

export default useSessions;