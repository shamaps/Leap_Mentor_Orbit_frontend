// src/features/shared-dashboard/model/chat.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const getMessageHistory = (roomId: string, pageNum: number, limit: number) =>
  axiosInstance.get(`/messages/${roomId}`, {
    params: { page: pageNum, limit },
  });