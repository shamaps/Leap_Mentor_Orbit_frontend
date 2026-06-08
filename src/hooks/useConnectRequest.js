// src/hooks/useConnectRequest.js
import { useState, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";
import getErrorMessage from "../utils/getErrorMessage";

const useConnectRequest = () => {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inFlightRef = useRef(false); // ← synchronous in-flight guard

  const sendRequest = async ({ mentorId, message, selectedSlots, sessionRate, sessionCount }) => {
    if (inFlightRef.current) return false; // ← blocks any concurrent call immediately

    setError("");
    setSuccess(false);

    if (!selectedSlots || selectedSlots.length === 0) {
      setError("Please select at least one available slot before sending.");
      return false;
    }

    try {
      inFlightRef.current = true; // ← lock before async starts
      setSending(true);
      const payload = {
        mentorId,
        message,
        selectedSlots,
        sessionRate,
        sessionCount,
      };

      await axiosInstance.post("/connect-requests", payload);
      setSuccess(true);
      return true;
    } catch (err) {
      const apiMsg = getErrorMessage(err, "Failed to send request.");
      setError(apiMsg); 
      return false;
    } finally {
      inFlightRef.current = false; // ← release lock
      setSending(false);
    }
  };

  const reset = () => {
    inFlightRef.current = false;
    setSending(false);
    setSuccess(false);
    setError("");
  };

  return { sending, success, error, sendRequest, reset };
};

export default useConnectRequest;
