// src/hooks/useInvoiceDownload.js
import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import logger from "../utils/logger";

export const useInvoiceDownload = () => {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");

    const downloadInvoice = async (requestId) => {
        try {
            setDownloading(true);
            setError("");
            const res = await axiosInstance.get(`/invoices/${requestId}`, {
                responseType: "arraybuffer",
            });

            const url = window.URL.createObjectURL(
                new Blob([res.data], { type: "application/pdf" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `Invoice-${requestId.slice(-6).toUpperCase()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            logger.error("Invoice download failed", { requestId, message: err.message });
            setError("Failed to download invoice. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return { downloading, error, downloadInvoice };
};