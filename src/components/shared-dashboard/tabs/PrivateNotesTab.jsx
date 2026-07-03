// src/components/shared-dashboard/tabs/PrivateNotesTab.jsx
import { useState, useEffect, useRef } from "react";
import useNotes from "../../../hooks/useNotes";
import usePrivateNotes from "../../../hooks/usePrivateNotes";
import EmptyState from "../../common/EmptyState";
// ── Helpers ───────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
const formatDateSeparator = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
const isSameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

// ── File Type Config ──────────────────────────────────────────
const FILE_TYPE_CONFIG = {
  pdf: {
    label: "PDF",
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
    icon: "📄",
  },
  image: {
    label: "IMG",
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    border: "border-emerald-200",
    icon: "🖼️",
  },
  doc: {
    label: "DOC",
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
    icon: "📝",
  },
  ppt: {
    label: "PPT",
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
    icon: "📊",
  },
  excel: {
    label: "XLS",
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-200",
    icon: "📈",
  },
  txt: {
    label: "TXT",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: "📃",
  },
  other: {
    label: "FILE",
    bg: "bg-violet-100",
    text: "text-violet-600",
    border: "border-violet-200",
    icon: "📎",
  },
};

// ── Upload Modal (Private) ────────────────────────────────────
const UploadModal = ({ onUpload, uploading, onClose }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  const validateAndSet = (file) => {
    setFileError("");
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("File type not supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File too large. Maximum size is 10MB.");
      return;
    }
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };
  const handleFileInput = (e) => validateAndSet(e.target.files?.[0]);
  const handleUpload = async () => {
    if (!selectedFile) return;
    const result = await onUpload(selectedFile, title);
    if (result?.success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Upload Private File
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Only visible to you</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs font-semibold text-amber-700">
              This file will be <strong>private</strong> — your partner cannot
              see it.
            </p>
          </div>
          <div
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
              dragOver
                ? "border-amber-400 bg-amber-50 cursor-pointer"
                : selectedFile
                  ? "border-emerald-400 bg-emerald-50 cursor-default"
                  : "border-slate-200 bg-slate-50 cursor-pointer hover:border-amber-300 hover:bg-amber-50/40"
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700 break-all">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setTitle("");
                    setFileError("");
                  }}
                  className="text-xs text-slate-400 underline hover:text-slate-600 transition-colors"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Drop file here or{" "}
                    <span className="text-amber-600">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, Word, PPT, Excel, Images · Max 10MB
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.txt"
            />
          </div>
          {fileError && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              <p className="text-xs text-red-600 font-medium">{fileError}</p>
            </div>
          )}
          {selectedFile && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Title (optional)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Week 2 Notes"
                className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50 text-slate-800 font-medium"
              />
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !!fileError}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  </svg>
                  Upload Private File
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Private File Card ─────────────────────────────────────────
const PrivateFileCard = ({ note, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const cfg = FILE_TYPE_CONFIG[note.fileType] || FILE_TYPE_CONFIG.other;

  const handleDelete = async () => {
    if (!window.confirm("Delete this file?")) return;
    setDeleting(true);
    await onDelete(note._id);
    setDeleting(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(note.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = note.fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(note.fileUrl, "_blank");
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 hover:border-amber-200 hover:shadow-md transition-all duration-200">
      <div
        className={`rounded-xl flex flex-col items-center justify-center shrink-0 border p-2.5 ${cfg.bg} ${cfg.border}`}
        style={{ width: "52px", height: "52px" }}
      >
        <span className="text-xl leading-none">{cfg.icon}</span>
        <span
          className={`text-[8px] font-black tracking-wider mt-0.5 ${cfg.text}`}
        >
          {cfg.label}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">
              {note.title || note.fileName}
            </p>
            {note.title && note.title !== note.fileName && (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {note.fileName}
              </p>
            )}
          </div>
          <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Private
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          {formatFileSize(note.fileSize)} · {formatDate(note.createdAt)}
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-white text-red-500 text-xs font-semibold hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Notepad Editor ────────────────────────────────────────────
const NotepadEditor = ({ note, onSave, onDelete, onClose, saving }) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setDirty(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [note?._id]);

  const handleSave = async () => {
    const result = await onSave(note?._id, title, content);
    if (result?.success) setDirty(false);
  };

  const downloadTxt = () => {
    const blob = new Blob([`${title}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "note"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>${title || "Note"}</title>
      <style>body{font-family:Georgia,serif;padding:48px;max-width:680px;margin:auto;color:#1e293b;line-height:1.7;}
      h1{font-size:24px;margin-bottom:28px;border-bottom:2px solid #e2e8f0;padding-bottom:16px;font-weight:700;}
      pre{white-space:pre-wrap;font-family:inherit;font-size:15px;}</style></head>
      <body><h1>${title || "Untitled Note"}</h1><pre>${content}</pre></body></html>
    `);
    win.document.close();
    win.print();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div
      className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm"
      style={{ height: "100%" }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Note title..."
          className="flex-1 text-base font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300 min-w-0 mr-4"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadTxt}
            title="Download as .txt"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white hover:border-slate-300 hover:text-slate-800 transition-all"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            .txt
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            title="Download as PDF"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white hover:border-slate-300 hover:text-slate-800 transition-all"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              dirty
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                Saving
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save
              </>
            )}
          </button>
          {note?._id && (
            <button
              type="button"
              onClick={() => onDelete(note._id)}
              className="p-2 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Textarea — fills all remaining height */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setDirty(true);
        }}
        placeholder="Start writing your private note here…"
        className="flex-1 w-full px-6 py-5 text-sm text-slate-700 leading-relaxed resize-none outline-none bg-white placeholder:text-slate-300 font-medium overflow-y-auto"
      />

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
        <span className="text-[11px] text-slate-500 font-medium">
          {wordCount} word{wordCount !== 1 ? "s" : ""} · {charCount} char
          {charCount !== 1 ? "s" : ""}
        </span>
        {dirty && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  );
};

// ── Note List Item (sidebar) ──────────────────────────────────
const NoteListItem = ({ note, isActive, onClick }) => {
  const preview = note.content?.trim()?.slice(0, 60) || "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 ${
        isActive
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <p
        className={`text-sm font-bold truncate ${isActive ? "text-blue-800" : "text-slate-700"}`}
      >
        {note.title || "Untitled Note"}
      </p>
      {preview && (
        <p className="text-xs text-slate-400 mt-0.5 truncate">{preview}</p>
      )}
      <p
        className={`text-[10px] mt-1 font-medium ${isActive ? "text-blue-400" : "text-slate-400"}`}
      >
        {formatDate(note.updatedAt)}
      </p>
    </button>
  );
};

// ── Notepad Section ───────────────────────────────────────────
const NotepadSection = ({ connectId, isCompleted }) => {
  const { notes, loading, saving, createNote, updateNote, deleteNote } =
    usePrivateNotes(connectId);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [mobileView, setMobileView] = useState("list");

  useEffect(() => {
    if (!loading && notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0]._id);
    }
  }, [loading, notes]);

  const activeNote = notes.find((n) => n._id === activeNoteId) || null;

  const handleCreate = async () => {
    const result = await createNote("Untitled Note", "");
    if (result?.success) {
      setActiveNoteId(result.note._id);
      setMobileView("editor");
    }
  };

  const handleSave = async (noteId, title, content) => {
    if (noteId) return await updateNote(noteId, title, content);
    const result = await createNote(title, content);
    if (result?.success) setActiveNoteId(result.note._id);
    return result;
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    await deleteNote(noteId);
    setActiveNoteId(notes.find((n) => n._id !== noteId)?._id || null);
    setMobileView("list");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    /* ── Horizontal layout: narrow sidebar | wide editor ── */
    <div
      className="flex gap-4 w-full overflow-hidden"
      style={{ height: "500px" }}
    >
      {/* Sidebar — fixed narrow width */}
      <div
        className={`flex flex-col gap-2.5 shrink-0 ${mobileView === "editor" ? "hidden" : "flex"} md:flex`}
        style={{ width: "200px" }}
      >
        {!isCompleted && (
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Note
          </button>
        )}
        {notes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl">
            <EmptyState compact icon={<span className="text-2xl">📝</span>} message="No notes yet" />
          </div>
        ) : (
          <div
            className="flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: "480px" }}
          >
            {notes.map((note) => (
              <NoteListItem
                key={note._id}
                note={note}
                isActive={activeNoteId === note._id}
                onClick={() => {
                  setActiveNoteId(note._id);
                  setMobileView("editor");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor — takes all remaining horizontal space */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
      >
        {/* Mobile back */}
        <div className="md:hidden mb-3">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to notes
          </button>
        </div>

        {activeNote ? (
          <NotepadEditor
            note={activeNote}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => {
              setActiveNoteId(null);
              setMobileView("list");
            }}
            saving={saving}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">
                No note selected
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Create a new note or select one from the list.
              </p>
            </div>
            {!isCompleted && (
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Note
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Private Files Section ─────────────────────────────────────
const PrivateFilesSection = ({ connect }) => {
  const [showUpload, setShowUpload] = useState(false);
  const { privateNotes, loading, uploading, error, uploadNote, deleteNote } =
    useNotes(connect?._id);
  const isCompleted = connect?.status === "completed";

  const handleUpload = async (file, title) => uploadNote(file, title, true);
  const handleDelete = async (noteId) => deleteNote(noteId, true);

  const safeNotes = privateNotes || [];

  const groupedItems = [];
  safeNotes.forEach((note, index) => {
    const prev = safeNotes[index - 1];
    if (!prev || !isSameDay(prev.createdAt, note.createdAt)) {
      groupedItems.push({
        type: "separator",
        dateStr: note.createdAt,
        key: `sep-${note._id}`,
      });
    }
    groupedItems.push({ type: "note", note, key: note._id });
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800">Private Files</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {safeNotes.length} file{safeNotes.length !== 1 ? "s" : ""} — only
            visible to you
          </p>
        </div>
        {!isCompleted && (
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all shadow-sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Private File
          </button>
        )}
      </div>

      {error && !uploading && (
        <div className="flex items-center gap-2.5 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 animate-pulse w-full"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3 bg-slate-100 rounded w-3/5" />
                <div className="h-2.5 bg-slate-100 rounded w-2/5" />
                <div className="h-7 bg-slate-100 rounded-lg w-24 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : safeNotes.length === 0 ? (
          <EmptyState
            icon={
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
            message="No private files yet"
            subMessage="Upload files that only you can access — your session partner won't see these."
            actionLabel={!isCompleted ? "Upload First Private File" : undefined}
            onAction={!isCompleted ? () => setShowUpload(true) : undefined}
          />
      ) : (
        <div className="w-full grid grid-cols-2 gap-4">
          {groupedItems.map((item) =>
            item.type === "separator" ? (
              <div
                key={item.key}
                className="col-span-2 flex items-center gap-3 my-2"
              >
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-bold text-slate-500 px-3 py-1 rounded-full bg-white border border-slate-200 whitespace-nowrap shadow-sm">
                  {formatDateSeparator(item.dateStr)}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            ) : (
              <PrivateFileCard
                key={item.key}
                note={item.note}
                onDelete={handleDelete}
              />
            ),
          )}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onUpload={handleUpload}
          uploading={uploading}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};

// ── Main Private Tab ──────────────────────────────────────────
const PrivateNotesTab = ({ connect }) => {
  const [privateSubTab, setPrivateSubTab] = useState("files");
  const isCompleted = connect?.status === "completed";

  return (
    <div className="w-full">
      {/* Private banner */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800">Private Workspace</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Your files and notes here are only visible to you — never shared
            with your mentor or mentee.
          </p>
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setPrivateSubTab("files")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            privateSubTab === "files"
              ? "bg-white text-slate-800 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Files
        </button>
        <button
          onClick={() => setPrivateSubTab("notepad")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            privateSubTab === "notepad"
              ? "bg-white text-slate-800 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Notepad
        </button>
      </div>

      {privateSubTab === "files" && <PrivateFilesSection connect={connect} />}
      {privateSubTab === "notepad" && (
        <NotepadSection connectId={connect._id} isCompleted={isCompleted} />
      )}
    </div>
  );
};

export default PrivateNotesTab;
