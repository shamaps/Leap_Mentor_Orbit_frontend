// src/api/mentorProfile.api.js
import axiosInstance from "@/shared/utils/axiosInstance";

export const getMentorProfile = async () => {
    const res = await axiosInstance.get("/mentor-profile/me");
    return res.data;
};

export const updateMentorProfile = async (payload) => {
    const res = await axiosInstance.patch("/mentor-profile/me", payload);
    return res.data;
};
export const submitVerificationDocuments = (formData) =>
    axiosInstance.post("/upload/verification-documents", formData);

export const downloadInvoicePdf = (requestId) =>
    axiosInstance.get(`/invoices/${requestId}`, { responseType: "arraybuffer" });