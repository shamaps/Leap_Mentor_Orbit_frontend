// src/hooks/useInvoiceDownload.js
import { useState } from "react";
import { downloadInvoicePdf } from "@/features/mentor/model/mentorProfile.api";
import logger from "@/shared/utils/logger";

export const useInvoiceDownload = () => {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");

    const downloadInvoice = async (requestId: string) => {
        try {
            setDownloading(true);
            setError("");
            const res = await downloadInvoicePdf(requestId);

            const url = globalThis.URL.createObjectURL(
                new Blob([res.data], { type: "application/pdf" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `Invoice-${requestId.slice(-6).toUpperCase()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            globalThis.URL.revokeObjectURL(url);
        } catch (err) {
            logger.error("Invoice download failed", { requestId, message: err.message });
            setError("Failed to download invoice. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return { downloading, error, downloadInvoice };
};