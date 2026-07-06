// src/hooks/useLeapPointsRequest.js
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import logger from "../utils/logger";
import getErrorMessage from "../utils/getErrorMessage";
import { HTTP_STATUS } from "../constants/httpStatus";

export const useLeapPointsRequest = () => {
    const [requestStatus, setRequestStatus] = useState(null); // null | "pending" | "sent" | "sending" | "error"
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkExistingRequest = async () => {
            try {
                const res = await axiosInstance.get("/leap-requests/my-request");
                if (res.data?.status === "pending") {
                    setRequestStatus("pending");
                }
            } catch (err) {
                if (err.response?.status !== HTTP_STATUS.NOT_FOUND) {
                    logger.warn("Leap request check failed", {
                        detail: err.response?.data || err.message,
                    });
                }
            } finally {
                setChecking(false);
            }
        };
        checkExistingRequest();
    }, []);

    const handleUpgradeRequest = async () => {
        try {
            setRequestStatus("sending");
            await axiosInstance.post("/leap-requests", { reason: "balance_refill" });
            setRequestStatus("sent");
        } catch (err) {
            const msg = err.response?.data?.message || "";
            if (
                msg.toLowerCase().includes("pending") ||
                err.response?.status === HTTP_STATUS.CONFLICT
            ) {
                setRequestStatus("pending");
            } else {
                logger.error("Leap request error", {
                    detail: getErrorMessage(err),
                });
                setRequestStatus("error");
                setTimeout(() => setRequestStatus(null), 3000);
            }
        }
    };

    return { requestStatus, checking, handleUpgradeRequest };
};