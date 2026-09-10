// src/api/ai.api.js
import axiosInstance from "@/shared/utils/axiosInstance";

export const sendAiChatMessage = (payload) =>
    axiosInstance.post("/ai/chat", payload);