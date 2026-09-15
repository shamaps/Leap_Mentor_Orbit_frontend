// src/features/mentor/presenter/useAvailability.ts
import { useState, useEffect } from "react";
import * as availabilityApi from "@/features/mentor/model/availability.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";
import type { AvailabilityState, SessionDuration, SpecificDate } from "@/features/mentor/model/availability.types";

interface StatusMessage {
  type: "" | "success" | "error";
  text: string;
}

interface UseAvailabilityReturn {
  availability: AvailabilityState;
  setAvailability: React.Dispatch<React.SetStateAction<AvailabilityState>>;
  loading: boolean;
  saving: boolean;
  msg: StatusMessage;
  toggleDuration: (duration: SessionDuration) => void;
  updateTimezone: (tz: string) => void;
  setSpecificDates: (updater: SpecificDate[] | ((prev: SpecificDate[]) => SpecificDate[])) => void;
  saveAvailability: () => Promise<void>;
  cancelChanges: () => Promise<void>;
}

const useAvailability = (): UseAvailabilityReturn => {
  const [availability, setAvailability] = useState<AvailabilityState>({
    timezone: "Asia/Kolkata",
    sessionDurations: [30, 60],
    googleCalendarConnected: false,
    specificDates: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<StatusMessage>({ type: "", text: "" });

  // Fetch existing availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const data = await availabilityApi.getMyAvailability();
        setAvailability((prev) => ({
          ...prev,
          ...data,
          specificDates: data.specificDates || [],
        }));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== HTTP_STATUS.NOT_FOUND) {
          setMsg({ type: "error", text: getErrorMessage(err, "Failed to load availability.") });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  // Toggle session duration
  const toggleDuration = (duration: SessionDuration) => {
    setAvailability((prev) => {
      const current = prev.sessionDurations;
      const updated = current.includes(duration)
        ? current.filter((d) => d !== duration)
        : [...current, duration].sort((a, b) => a - b);
      return { ...prev, sessionDurations: updated };
    });
  };

  // Update timezone
  const updateTimezone = (tz: string) => {
    setAvailability((prev) => ({ ...prev, timezone: tz }));
  };

  // Set specificDates — accepts value or updater function
  const setSpecificDates = (updater: SpecificDate[] | ((prev: SpecificDate[]) => SpecificDate[])) => {
    setAvailability((prev) => ({
      ...prev,
      specificDates:
        typeof updater === "function" ? updater(prev.specificDates) : updater,
    }));
  };

  // Save
  const saveAvailability = async () => {
    setMsg({ type: "", text: "" });
    try {
      setSaving(true);
      await availabilityApi.saveMyAvailability({
        timezone: availability.timezone,
        sessionDurations: availability.sessionDurations,
        specificDates: availability.specificDates,
      });
      setMsg({ type: "success", text: "Availability saved successfully!" });
    } catch (err: unknown) {
      const apiMsg = getErrorMessage(err, "Failed to save.");
      setMsg({ type: "error", text: apiMsg });
    } finally {
      setSaving(false);
    }
  };

  // Cancel — re-fetch from server to discard local changes
  const cancelChanges = async () => {
    try {
      setLoading(true);
      const data = await availabilityApi.getMyAvailability();
      setAvailability((prev) => ({
        ...prev,
        ...data,
        specificDates: data.specificDates || [],
      }));
      setMsg({ type: "", text: "" });
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  return {
    availability,
    setAvailability, // ← exposed so AvailabilityTab can update googleCalendarConnected
    loading,
    saving,
    msg,
    toggleDuration,
    updateTimezone,
    setSpecificDates,
    saveAvailability,
    cancelChanges,
  };
};

export default useAvailability;