// src/hooks/useSlotLock.js
import { useCallback, useRef } from "react";
import * as sessionsApi from "@/features/shared-dashboard/model/sessions.api";
import logger from "@/shared/utils/logger";
import { useToast } from "@/shared/context/ToastContext";
const useSlotLock = (mentorId) => {
  const lockedKeys = useRef(new Set()); // tracks keys this session locked
  const { showToast } = useToast();
 
  // Lock a slot — called when mentee selects
  // Returns { ok: true } or { ok: false, code, msg }
 
  const lockSlot = useCallback(
    async (date, startTime, endTime) => {
      try {
        const data = await sessionsApi.lockSlot({ mentorId, date, startTime, endTime });
        lockedKeys.current.add(`${date}-${startTime}`);
        return { ok: true, expiresAt: data.expiresAt };
      } catch (err) {
        const code = err?.response?.data?.code;
        const msg = err?.response?.data?.message || "Could not lock slot";
        return { ok: false, code, msg };
      }
    },
    [mentorId],
  );

 
  // Unlock a slot — called when mentee deselects
 
  const unlockSlot = useCallback(
    async (date, startTime, endTime) => {
      try {
        await sessionsApi.unlockSlot({ mentorId, date, startTime, endTime });
        lockedKeys.current.delete(`${date}-${startTime}`);
      } catch (err) {
        // Non-fatal — lock self-expires via TTL either way — but the user
        // deliberately clicked to free this slot, so tell them it didn't
        // go through immediately rather than leaving them guessing.
        logger.warn("unlock failed", { message: err?.message });
        showToast({
          type: "info",
          title: "Slot release delayed",
          message: "It'll free up automatically in a few minutes.",
        });
      }
    },
    [mentorId],
  );


 
  // Unlock all — called when mentee closes modal
 
  const unlockAll = useCallback(async () => {
    try {
      await sessionsApi.unlockAllSlots(mentorId);
      lockedKeys.current.clear();
    } catch (err) {
      logger.warn("unlock-all failed", { message: err?.message });
    }
  }, [mentorId]);

  return { lockSlot, unlockSlot, unlockAll };
};

export default useSlotLock;
