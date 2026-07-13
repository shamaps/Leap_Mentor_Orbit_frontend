// src/hooks/useVerificationSubmit.js
import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

export const useVerificationSubmit = () => {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const submitVerification = async ({ phoneNumber, resumeFile, workExperienceFiles }) => {
        setMsg({ type: "", text: "" });
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("phoneNumber", phoneNumber.trim());
            formData.append("resume", resumeFile);
            workExperienceFiles.forEach((file) => {
                formData.append("workExperienceDocs", file);
            });

            await axiosInstance.post("/upload/verification-documents", formData);
            return { success: true };
        } catch (err) {
            setMsg({
                type: "error",
                text:
                    err?.response?.data?.message ||
                    "Failed to submit documents. Please try again.",
            });
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    return { loading, msg, submitVerification };
};