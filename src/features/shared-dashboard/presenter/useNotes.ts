// src/hooks/useNotes.js
import { useState, useEffect, useCallback } from "react";
import {
  getNotes as apiGetNotes,
  uploadNote as apiUploadNote,
  deleteNote as apiDeleteNote,
  getPrivateNotes as apiGetPrivateNotes,
} from "@/features/shared-dashboard/model/notes.api";
import logger from "@/shared/utils/logger";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import type { SharedNote } from "@/features/shared-dashboard/model/types";

const useNotes = (connectRequestId?: string | null) => {
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [privateNotes, setPrivateNotes] = useState<SharedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [privateLoading, setPrivateLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch shared notes ────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    if (!connectRequestId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetNotes(connectRequestId);
      setNotes(data.notes || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load notes."));
    } finally {
      setLoading(false);
    }
  }, [connectRequestId]);

  // ── Fetch private notes ───────────────────────────────────
  const fetchPrivateNotes = useCallback(async () => {
    if (!connectRequestId) return;
    try {
      setPrivateLoading(true);
      const data = await apiGetPrivateNotes(connectRequestId);
      setPrivateNotes(data.notes || []);
    } catch (err) {
      //  Don't set global error for private notes — just log
      logger.warn("Private notes fetch failed", {
        message: getErrorMessage(err),
      });
    } finally {
      setPrivateLoading(false);
    }
  }, [connectRequestId]);

  useEffect(() => {
    fetchNotes();
    fetchPrivateNotes();
  }, [fetchNotes, fetchPrivateNotes]);

  // ── Upload a note ─────────────────────────────────────────
  const uploadNote = useCallback(
    async (file: File, title = "", isPrivate = false) => {
      if (!file || !connectRequestId) return;
      try {
        setUploading(true);
        setError(null);
        const data = await apiUploadNote(
          connectRequestId,
          file,
          title,
          isPrivate,
        );
        if (isPrivate) {
          setPrivateNotes((prev) => [data.note, ...prev]);
        } else {
          setNotes((prev) => [data.note, ...prev]);
        }
        return { success: true };
      } catch (err) {
        const msg = getErrorMessage(err, "Upload failed. Please try again.");
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setUploading(false);
      }
    },
    [connectRequestId],
  );

  // ── Delete a note ─────────────────────────────────────────
  const deleteNote = useCallback(async (noteId: string, isPrivate = false) => {
    try {
      setError(null);
      await apiDeleteNote(noteId);
      if (isPrivate) {
        setPrivateNotes((prev) => prev.filter((n) => n._id !== noteId));
      } else {
        setNotes((prev) => prev.filter((n) => n._id !== noteId));
      }
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, "Delete failed. Please try again.");
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  return {
    notes,
    privateNotes,
    loading,
    privateLoading,
    uploading,
    error,
    uploadNote,
    deleteNote,
    refetch: fetchNotes,
    refetchPrivate: fetchPrivateNotes,
  };
};

export default useNotes;