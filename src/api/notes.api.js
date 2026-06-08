// src/notes.api.js
import axiosInstance from "../utils/axiosInstance";

// ── Upload a note (multipart/form-data) ───────────────────────
export const uploadNote = async (connectRequestId, file, title = "", isPrivate = false) => {
  const formData = new FormData();
  formData.append("file",             file);
  formData.append("connectRequestId", connectRequestId);
  if (title?.trim())  formData.append("title",     title.trim());
  if (isPrivate)      formData.append("isPrivate",  "true");       // ✅ NEW

  const res = await axiosInstance.post("/notes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ── Fetch all shared notes for a session ──────────────────────
export const getNotes = async (connectRequestId) => {
  const res = await axiosInstance.get(
    `/notes/${connectRequestId}`
  );
  return res.data;
};

// ── Fetch private notes (own only) ────────────────────────────
export const getPrivateNotes = async (connectRequestId) => {
  const res = await axiosInstance.get(
    `/notes/${connectRequestId}/private`
  );
  return res.data;
};

// ── Delete a note ─────────────────────────────────────────────
export const deleteNote = async (noteId) => {
  const res = await axiosInstance.delete(
    `/notes/${noteId}`
  );
  return res.data;
};