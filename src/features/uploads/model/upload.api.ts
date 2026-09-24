// src/api/upload.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const uploadProfilePicture = (formData: FormData) =>
    axiosInstance.post("/upload/profile-picture", formData);