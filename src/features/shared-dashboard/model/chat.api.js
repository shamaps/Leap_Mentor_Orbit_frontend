// src/features/shared-dashboard/model/chat.api.js
import axiosInstance from "@/shared/utils/axiosInstance";

export const getMessageHistory = (roomId, pageNum, limit) =>
  axiosInstance.get(`/messages/${roomId}`, {
    params: { page: pageNum, limit },
  });
