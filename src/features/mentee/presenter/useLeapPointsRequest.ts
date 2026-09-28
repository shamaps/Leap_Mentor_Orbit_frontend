// src/hooks/useLeapPointsRequest.js
import { useState, useEffect } from "react";
import { getMyLeapRequest, createLeapRequest } from "@/features/mentee/model/menteeEngagement.api";
import logger from "@/shared/utils/logger";
import getErrorMessage, { getApiErrorDetails, getHttpErrorStatus } from "@/shared/utils/getErrorMessage";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";

export const useLeapPointsRequest = () => {
    const [requestStatus, setRequestStatus] = useState<"pending" | "sent" | "sending" | "error" | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkExistingRequest = async () => {
            try {
                const res = await getMyLeapRequest();
                if (res.data?.status === "pending") {
                    setRequestStatus("pending");
                }
            } catch (err) {
                if (getHttpErrorStatus(err) !== HTTP_STATUS.NOT_FOUND) {
                    const details = getApiErrorDetails(err);
                    logger.warn("Leap request check failed", {
                        detail: details.data || details.message,
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
            await createLeapRequest();
            setRequestStatus("sent");
        } catch (err) {
            const msg = getErrorMessage(err, "");
            if (
                msg.toLowerCase().includes("pending") ||
                getHttpErrorStatus(err) === HTTP_STATUS.CONFLICT
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