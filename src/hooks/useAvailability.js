// src/hooks/useAvailability.js
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import getErrorMessage from "../utils/getErrorMessage";

const useAvailability = () => {
  const [availability, setAvailability] = useState({
    timezone: "Asia/Kolkata",
    sessionDurations: [30, 60],
    googleCalendarConnected: false,
    specificDates: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Fetch existing availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/availability/me");
        const { ...data } = res.data;
        setAvailability((prev) => ({
          ...prev,
          ...data,
          specificDates: data.specificDates || [],
        }));
      } catch (err) {
        if (err?.response?.status !== 404) {
          setMsg({ type: "error", text: "Failed to load availability." });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  // Toggle session duration
  const toggleDuration = (duration) => {
    setAvailability((prev) => {
      const current = prev.sessionDurations;
      const updated = current.includes(duration)
        ? current.filter((d) => d !== duration)
        : [...current, duration].sort((a, b) => a - b);
      return { ...prev, sessionDurations: updated };
    });
  };

  // Update timezone
  const updateTimezone = (tz) => {
    setAvailability((prev) => ({ ...prev, timezone: tz }));
  };

  // Set specificDates — accepts value or updater function
  const setSpecificDates = (updater) => {
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
      await axiosInstance.patch("/availability/me", {
        timezone: availability.timezone,
        sessionDurations: availability.sessionDurations,
        specificDates: availability.specificDates,
      });
      setMsg({ type: "success", text: "Availability saved successfully!" });
    } catch (err) {
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
      const res = await axiosInstance.get("/availability/me");
      const { ...data } = res.data;
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
