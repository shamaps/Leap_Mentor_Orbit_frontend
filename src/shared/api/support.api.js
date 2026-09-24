// src/api/support.api.js
import axiosInstance from "@/shared/utils/axiosInstance";

export const submitSupportMessage = (payload) =>
    axiosInstance.post("/support/messages", payload);