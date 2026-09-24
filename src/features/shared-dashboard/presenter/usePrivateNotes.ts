// src/hooks/usePrivateNotes.js
import { useState, useEffect, useCallback } from "react";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import type { PrivateNote } from "@/features/shared-dashboard/model/types";
import {
  createPrivateNote as apiCreate,
  getPrivateNotes as apiGetAll,
  updatePrivateNote as apiUpdate,
  deletePrivateNote as apiDelete,
} from "@/features/shared-dashboard/model/privateNotes.api";

const usePrivateNotes = (connectRequestId?: string | null) => {
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all notes ───────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    if (!connectRequestId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetAll(connectRequestId);
      setNotes(data.notes || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load notes."));
    } finally {
      setLoading(false);
    }
  }, [connectRequestId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ── Create a note ─────────────────────────────────────────
  const createNote = useCallback(
    async (title = "Untitled Note", content = "") => {
      if (!connectRequestId) return undefined;
      try {
        setSaving(true);
        setError(null);
        const data = await apiCreate(connectRequestId, title, content);
        setNotes((prev) => [data.note, ...prev]);
        return { success: true, note: data.note };
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to create note.");
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSaving(false);
      }
    },
    [connectRequestId],
  );

  // ── Update a note ─────────────────────────────────────────
  const updateNote = useCallback(async (noteId: string, title: string, content: string) => {
    try {
      setSaving(true);
      setError(null);
      const data = await apiUpdate(noteId, title, content);
      setNotes((prev) => prev.map((n) => (n._id === noteId ? data.note : n)));
      return { success: true, note: data.note };
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save note.");
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Delete a note ─────────────────────────────────────────
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      setError(null);
      await apiDelete(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to delete note.");
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  return {
    notes,
    loading,
    saving,
    error,
    createNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
};

export default usePrivateNotes;