// src/components/shared-dashboard/tabs/PrivateNotesTab.jsx

import { useState, useEffect } from "react";
import useNotes from "@/features/shared-dashboard/presenter/useNotes";
import usePrivateNotes from "@/features/shared-dashboard/presenter/usePrivateNotes";
import EmptyState from "@/shared/components/EmptyState";
import { generateDateHeader } from "./privateNotes.utils";
import {
  LoadingSkeletons,
  UploadModal,
  PrivateFileCard,
  NotepadEditor,
  NoteListItem,
} from "./PrivateNotesTab.components";

// EmptyState is still a plain JS component (migrates in Phase 3.5); its inferred
// prop types mark every prop as required. Cast locally to avoid coupling
// this migration to that one.
const EmptyStateAny = EmptyState as any;

// ── Notepad Action Section ────────────────────────────────────
const NotepadSection = ({ connectId, isCompleted }: { connectId: string; isCompleted: boolean }) => {
  const { notes, loading, saving, createNote, updateNote, deleteNote } = usePrivateNotes(connectId);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState("list");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally syncing local state from an external source (prop/URL), not derivable from render inputs alone
    if (!loading && notes.length > 0 && !activeNoteId) setActiveNoteId(notes[0]._id);
  }, [loading, notes]);

  const activeNote = notes.find((n) => n._id === activeNoteId) || null;

  const handleCreateSequence = async () => {
    const result = await createNote("Untitled Note", "");
    if (result?.success) {
      setActiveNoteId(result.note._id);
      setMobileView("editor");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" /></div>;
  }

  return (
    <div className="flex gap-4 w-full overflow-hidden" style={{ height: "500px" }}>
      <div className={`flex flex-col gap-2.5 shrink-0 ${mobileView === "editor" ? "hidden" : "flex"} md:flex`} style={{ width: "200px" }}>
        {!isCompleted && (
          <button type="button" onClick={handleCreateSequence} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm">
            New Note
          </button>
        )}
        {notes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl"><EmptyStateAny compact icon={<span className="text-2xl">📝</span>} message="No notes yet" /></div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "480px" }}>
            {notes.map((note: any) => <NoteListItem key={note._id} note={note} isActive={activeNoteId === note._id} onClick={() => { setActiveNoteId(note._id); setMobileView("editor"); }} />)}
          </div>
        )}
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        <div className="md:hidden mb-3">
          <button type="button" onClick={() => setMobileView("list")} className="flex items-center gap-2 text-sm font-semibold text-slate-500">Back to notes</button>
        </div>

        {activeNote ? (
          <NotepadEditor note={activeNote} onSave={async (id, t, c) => id ? await updateNote(id, t, c) : await createNote(t, c)} onDelete={async (id: string) => { if (globalThis.confirm("Delete this note?")) { await deleteNote(id); setActiveNoteId(notes.find((n: any) => n._id !== id)?._id || null); setMobileView("list"); } }} onClose={() => { setActiveNoteId(null); setMobileView("list"); }} saving={saving} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">No note selected</p>
              <p className="text-sm text-slate-500 mt-1">Create a new note or select one from the list.</p>
            </div>
            {!isCompleted && <button type="button" onClick={handleCreateSequence} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm">New Note</button>}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Private Workspace Files Component Layout ──────────────────
const PrivateFilesSection = ({ connect }: { connect: any }) => {
  const [showUpload, setShowUpload] = useState(false);
  const { privateNotes, loading, uploading, error, uploadNote, deleteNote } = useNotes(connect?._id);
  const isCompleted = connect?.status === "completed";

  const buildPartitionSequence = () => {
    const list: any[] = [];
    const internalCollection = privateNotes || [];
    let i = 0;
    while (i < internalCollection.length) {
      const note = internalCollection[i];
      const prev = internalCollection[i - 1];
      if (!prev || new Date(prev.createdAt).toDateString() !== new Date(note.createdAt).toDateString()) {
        list.push({ type: "separator", dateStr: note.createdAt, key: `sep-${note._id}` });
      }
      list.push({ type: "note", note, key: note._id });
      i++;
    }
    return list;
  };
  let privateFilesContent;
  if (loading) {
    privateFilesContent = <LoadingSkeletons />;
  } else if ((privateNotes || []).length === 0) {
    privateFilesContent = (
      <EmptyStateAny
        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
        message="No private files yet" subMessage="Upload files that only you can access — your session partner won't see these."
        actionLabel={isCompleted ? undefined : "Upload First Private File"} onAction={isCompleted ? undefined : () => setShowUpload(true)}
      />
    );
  } else {
    privateFilesContent = (
      <div className="w-full grid grid-cols-2 gap-4">
        {buildPartitionSequence().map((item: any) => {
          if (item.type === "separator") {
            return (
              <div key={item.key} className="col-span-2 flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-bold text-slate-500 px-3 py-1 rounded-full bg-white border border-slate-200 whitespace-nowrap shadow-sm">{generateDateHeader(item.dateStr)}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            );
          }
          return <PrivateFileCard key={item.key} note={item.note} onDelete={async (id: string) => deleteNote(id, true)} />;
        })}
      </div>
    );
  }
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800">Private Files</h2>
          <p className="text-xs text-slate-500 mt-0.5">{(privateNotes || []).length} file{(privateNotes || []).length === 1 ? "" : "s"} — only visible to you</p>
        </div>
        {!isCompleted && (
          <button type="button" onClick={() => setShowUpload(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-sm">
            Upload Private File
          </button>
        )}
      </div>

      {error && !uploading && <div className="flex items-center gap-2.5 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5">{error}</div>}

      {privateFilesContent}

      {showUpload && <UploadModal onUpload={async (f: File, t: string) => uploadNote(f, t, true)} uploading={uploading} onClose={() => setShowUpload(false)} />}
    </div>
  );
};

// ── Root Parent Controller Container ──────────────────────────
const PrivateNotesTab = ({ connect }: { connect: any }) => {
  const [privateSubTab, setPrivateSubTab] = useState("files");

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800">Private Workspace</p>
          <p className="text-xs text-amber-700 mt-0.5">Your files and notes here are only visible to you — never shared with your mentor or mentee.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setPrivateSubTab("files")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${privateSubTab === "files" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Files</button>
        <button onClick={() => setPrivateSubTab("notepad")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${privateSubTab === "notepad" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Notepad</button>
      </div>

      {privateSubTab === "files" ? <PrivateFilesSection connect={connect} /> : <NotepadSection connectId={connect?._id} isCompleted={connect?.status === "completed"} />}
    </div>
  );
};

export default PrivateNotesTab;