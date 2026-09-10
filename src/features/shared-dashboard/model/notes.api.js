// src/notes.api.js
import axiosInstance from "@/shared/utils/axiosInstance";
// ── Upload a note (multipart/form-data) ───────────────────────
export const uploadNote = async (
  connectRequestId,
  file,
  title = "",
  isPrivate = false,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("connectRequestId", connectRequestId);
  if (title?.trim()) formData.append("title", title.trim());
  if (isPrivate) formData.append("isPrivate", "true"); 

  const res = await axiosInstance.post("/notes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ── Fetch all shared notes for a session ──────────────────────
export const getNotes = async (connectRequestId) => {
  const res = await axiosInstance.get(`/notes/${connectRequestId}`);
  return res.data;
};

// ── Fetch private notes (own only) ────────────────────────────
export const getPrivateNotes = async (connectRequestId) => {
  const res = await axiosInstance.get(`/notes/${connectRequestId}/private`);
  return res.data;
};

// ── Delete a note ─────────────────────────────────────────────
export const deleteNote = async (noteId) => {
  await axiosInstance.delete(`/notes/${noteId}`);
};

// ── Download a note's file as a Blob (direct fetch, not via axiosInstance,
// since fileUrl points to external storage e.g. S3/CDN, not our API host) ──
export const downloadFileAsBlob = async (fileUrl) => {
  return fetch(fileUrl);
};