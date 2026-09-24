// src/features/shared-dashboard/model/feedback.api.js
import axiosInstance from "@/shared/utils/axiosInstance";
export const getFeedback = (connectRequestId) =>
  axiosInstance.get(`/feedback/${connectRequestId}`);

export const submitFeedback = (connectRequestId, rating, comment, slotIndex) =>
  axiosInstance.post("/feedback", {
    connectRequestId,
    rating,
    comment,
    slotIndex,
  });
