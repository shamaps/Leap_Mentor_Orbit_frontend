// src/api/upload.api.js
import axiosInstance from "@/shared/utils/axiosInstance";

export const uploadProfilePicture = (formData) =>
    axiosInstance.post("/upload/profile-picture", formData);