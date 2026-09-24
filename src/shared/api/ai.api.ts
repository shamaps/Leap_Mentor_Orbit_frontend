// src/api/ai.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const sendAiChatMessage = (payload: unknown) =>
    axiosInstance.post("/ai/chat", payload);