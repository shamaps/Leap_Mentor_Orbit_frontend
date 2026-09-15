// src/api/support.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const submitSupportMessage = (payload: unknown) =>
    axiosInstance.post("/support/messages", payload);