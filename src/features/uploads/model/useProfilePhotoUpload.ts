// src/hooks/useProfilePhotoUpload.ts
import { useRef, useState, type ChangeEvent } from "react";
import { uploadProfilePicture } from "@/features/uploads/model/upload.api";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// ── Shared profile-photo upload logic for mentor + mentee onboarding ──
// onUploaded receives the Cloudinary URL; caller wires it into their own
// form-context onChange handler (signature differs slightly between
// mentor/mentee contexts, so that stays the caller's responsibility).
export const useProfilePhotoUpload = (onUploaded: (url: string) => void) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadErr, setUploadErr] = useState("");

    const handlePhotoClick = () => {
        if (!uploading) fileInputRef.current?.click();
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setUploadErr("Only image files are allowed.");
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setUploadErr("Image must be under 5MB.");
            return;
        }

        setUploadErr("");
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("profilePicture", file);

            const res = await uploadProfilePicture(formData);
            onUploaded(res.data.url);
        } catch (err: any) {
            setUploadErr(
                err?.response?.data?.message ||
                "Failed to upload image. Please try again.",
            );
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return { fileInputRef, uploading, uploadErr, handlePhotoClick, handleFileChange };
};