// src/privateNotes.api.js
import axiosInstance from "../utils/axiosInstance";
// Create a new private note
export const createPrivateNote = async (connectRequestId, title, content) => {
  const res = await axiosInstance.post(
    "/private-notes",
    { connectRequestId, title, content }
  );
  return res.data;
};

// Get all private notes for a session
export const getPrivateNotes = async (connectRequestId) => {
  const res = await axiosInstance.get(
    `private-notes/${connectRequestId}`
  );
  return res.data;
};

// Update a note
export const updatePrivateNote = async (noteId, title, content) => {
  const res = await axiosInstance.patch(
    `/private-notes/${noteId}`,
    { title, content }
  );
  return res.data;
};

// Delete a note
export const deletePrivateNote = async (noteId) => {
  await axiosInstance.delete(`/private-notes/${noteId}`);
};