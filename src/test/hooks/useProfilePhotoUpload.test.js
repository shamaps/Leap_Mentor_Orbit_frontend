// src/test/hooks/useProfilePhotoUpload.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import axiosInstance from "../../shared/utils/axiosInstance";
import { useProfilePhotoUpload } from "../../features/uploads/model/useProfilePhotoUpload";

vi.mock("../../shared/utils/axiosInstance");

const makeFile = (name, type, sizeBytes) => {
    const file = new File(["x".repeat(Math.min(sizeBytes, 10))], name, { type });
    Object.defineProperty(file, "size", { value: sizeBytes });
    return file;
};

describe("useProfilePhotoUpload", () => {
    let onUploaded;

    beforeEach(() => {
        vi.clearAllMocks();
        onUploaded = vi.fn();
    });

    it("has correct initial state", () => {
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));

        expect(result.current.uploading).toBe(false);
        expect(result.current.uploadErr).toBe("");
        expect(result.current.fileInputRef.current).toBeNull();
    });

    it("handlePhotoClick triggers the file input click when not uploading", () => {
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));
        const clickFn = vi.fn();
        result.current.fileInputRef.current = { click: clickFn };

        act(() => {
            result.current.handlePhotoClick();
        });

        expect(clickFn).toHaveBeenCalled();
    });

    it("handleFileChange returns early when no file is selected", async () => {
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [] } });
        });

        expect(axiosInstance.post).not.toHaveBeenCalled();
        expect(result.current.uploadErr).toBe("");
    });

    it("sets an error for non-image file types", async () => {
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));
        const file = makeFile("doc.pdf", "application/pdf", 1000);

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });

        expect(result.current.uploadErr).toBe("Only image files are allowed.");
        expect(axiosInstance.post).not.toHaveBeenCalled();
    });

    it("sets an error for files over 5MB", async () => {
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));
        const file = makeFile("big.png", "image/png", 6 * 1024 * 1024);

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });

        expect(result.current.uploadErr).toBe("Image must be under 5MB.");
        expect(axiosInstance.post).not.toHaveBeenCalled();
    });

    it("uploads successfully and calls onUploaded with the returned URL", async () => {
        axiosInstance.post.mockResolvedValue({ data: { url: "https://cdn.example.com/photo.jpg" } });
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));
        result.current.fileInputRef.current = { value: "C:\\fakepath\\photo.png" };
        const file = makeFile("photo.png", "image/png", 1000);

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });

        expect(axiosInstance.post).toHaveBeenCalledWith(
            "/upload/profile-picture",
            expect.any(FormData),
        );
        const formDataArg = axiosInstance.post.mock.calls[0][1];
        expect(formDataArg.get("profilePicture")).toBe(file);
        expect(onUploaded).toHaveBeenCalledWith("https://cdn.example.com/photo.jpg");
        expect(result.current.uploading).toBe(false);
        expect(result.current.uploadErr).toBe("");
        expect(result.current.fileInputRef.current.value).toBe("");
    });

    it("sets an error message from the API response on failure", async () => {
        axiosInstance.post.mockRejectedValue({
            response: { data: { message: "Upload service unavailable" } },
        });
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));
        result.current.fileInputRef.current = { value: "C:\\fakepath\\photo.png" };
        const file = makeFile("photo.png", "image/png", 1000);

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });

        expect(result.current.uploadErr).toBe("Upload service unavailable");
        expect(onUploaded).not.toHaveBeenCalled();
        expect(result.current.uploading).toBe(false);
    });

    it("falls back to a generic error message when the API gives no message", async () => {
        axiosInstance.post.mockRejectedValue({});
        const { result } = renderHook(() => useProfilePhotoUpload(onUploaded));
        result.current.fileInputRef.current = { value: "C:\\fakepath\\photo.png" };
        const file = makeFile("photo.png", "image/png", 1000);

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });

        expect(result.current.uploadErr).toBe("Failed to upload image. Please try again.");
    });
});