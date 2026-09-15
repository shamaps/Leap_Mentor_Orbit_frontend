// src/privateNotes.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

// Create a new private note
export const createPrivateNote = async (connectRequestId: string, title: string, content: string) => {
  const res = await axiosInstance.post("/private-notes", {
    connectRequestId,
    title,
    content,
  });
  return res.data;
};

// Get all private notes for a session
export const getPrivateNotes = async (connectRequestId: string) => {
  const res = await axiosInstance.get(`private-notes/${connectRequestId}`);
  return res.data;
};

// Update a note
export const updatePrivateNote = async (noteId: string, title: string, content: string) => {
  const res = await axiosInstance.patch(`/private-notes/${noteId}`, {
    title,
    content,
  });
  return res.data;
};

// Delete a note
export const deletePrivateNote = async (noteId: string): Promise<void> => {
  await axiosInstance.delete(`/private-notes/${noteId}`);
};