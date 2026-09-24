// src/features/shared-dashboard/model/feedback.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const getFeedback = (connectRequestId: string) =>
  axiosInstance.get(`/feedback/${connectRequestId}`);

export const submitFeedback = (
  connectRequestId: string,
  rating: number,
  comment: string,
  slotIndex?: number,
) =>
  axiosInstance.post("/feedback", {
    connectRequestId,
    rating,
    comment,
    slotIndex,
  });