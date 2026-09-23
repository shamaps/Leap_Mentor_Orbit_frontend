// src/features/connects/presenter/useConnectRequest.ts
import { useState, useRef } from "react";
import { sendConnectRequest } from "@/features/connects/model/connectRequests.api";
import { normalizeApiError } from "@/shared/utils/apiError";

interface SendRequestArgs {
  mentorId: string;
  message: string;
  selectedSlots: unknown[];
  sessionRate: number;
  sessionCount: number;
}

const useConnectRequest = () => {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isRetryable, setIsRetryable] = useState(false); // new — enables a "Retry" button in the UI
  const inFlightRef = useRef(false);

  const sendRequest = async ({
    mentorId,
    message,
    selectedSlots,
    sessionRate,
    sessionCount,
  }: SendRequestArgs): Promise<boolean> => {
    if (inFlightRef.current) return false;

    setError("");
    setSuccess(false);
    setIsRetryable(false);

    if (!selectedSlots || selectedSlots.length === 0) {
      setError("Please select at least one available slot before sending.");
      return false;
    }

    try {
      inFlightRef.current = true;
      setSending(true);
      const payload = { mentorId, message, selectedSlots, sessionRate, sessionCount };

      await sendConnectRequest(payload);
      setSuccess(true);
      return true;
    } catch (err) {
      const normalized = normalizeApiError(err, "Failed to send request.");
      setError(normalized.message);
      setIsRetryable(normalized.isRetryable);
      return false;
    } finally {
      inFlightRef.current = false;
      setSending(false);
    }
  };

  const reset = () => {
    inFlightRef.current = false;
    setSending(false);
    setSuccess(false);
    setError("");
    setIsRetryable(false);
  };

  return { sending, success, error, isRetryable, sendRequest, reset };
};

export default useConnectRequest;