// src/hooks/useVerificationSubmit.js
import { useState } from "react";
import { submitVerificationDocuments } from "@/features/mentor/model/mentorProfile.api";

export const useVerificationSubmit = () => {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const submitVerification = async ({
        phoneNumber,
        resumeFile,
        workExperienceFiles,
    }: {
        phoneNumber: string;
        resumeFile: File;
        workExperienceFiles: File[];
    }) => {
        setMsg({ type: "", text: "" });
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("phoneNumber", phoneNumber.trim());
            formData.append("resume", resumeFile);
            workExperienceFiles.forEach((file: File) => {
                formData.append("workExperienceDocs", file);
            });

            await submitVerificationDocuments(formData);
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