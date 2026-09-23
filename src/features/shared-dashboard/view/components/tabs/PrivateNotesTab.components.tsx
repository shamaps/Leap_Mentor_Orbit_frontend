// src/features/shared-dashboard/view/components/tabs/PrivateNotesTab.components.tsx


import { useState, useRef, useEffect } from "react";
import { downloadFileAsBlob } from "@/features/shared-dashboard/model/notes.api";
import {
    computeByteSizeLabel,
    formatCustomDateString,
    ENUMERATED_FILE_MESSAGES,
    VALID_MIME_STRINGS,
    SKELETON_SLOT_IDS,
} from "./privateNotes.utils";

export const LoadingSkeletons = () => (
    <div className="grid grid-cols-2 gap-4 w-full">
        {SKELETON_SLOT_IDS.map((slotId) => (
            <div key={slotId} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 animate-pulse w-full">
                <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-3.5 pt-0.5">
                    <div className="h-2.5 bg-slate-100 rounded w-9/12" />
                    <div className="h-2 bg-slate-100 rounded w-3/12" />
                    <div className="h-6 bg-slate-100 rounded-lg w-24 mt-2" />
                </div>
            </div>
        ))}
    </div>
);

export const UploadModal = ({ onUpload, uploading, onClose }: { onUpload: (file: File, title: string) => Promise<{ success: boolean } | undefined>; uploading: boolean; onClose: () => void }) => {
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [fileError, setFileError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processIncomingFile = (targetFile?: File) => {
        setFileError("");
        if (!targetFile) return;
        if (!VALID_MIME_STRINGS.has(targetFile.type)) {
            setFileError("File type not supported.");
            return;
        }
        if (targetFile.size > 10 * 1024 * 1024) {
            setFileError("File too large. Maximum size is 10MB.");
            return;
        }
        setSelectedFile(targetFile);
        setTitle(targetFile.name.replace(/\.[^/.]+$/, ""));
    };
    let dropzoneStateClass = "border-slate-200 bg-slate-50 cursor-pointer hover:border-amber-300";
    if (dragOver) {
        dropzoneStateClass = "border-amber-400 bg-amber-50 cursor-pointer";
    } else if (selectedFile) {
        dropzoneStateClass = "border-emerald-400 bg-emerald-50 cursor-default";
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Upload Private File</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Only visible to you</p>
                    </div>
                    <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        <p className="text-xs font-semibold text-amber-700">This file will be <strong>private</strong> — your partner cannot see it.</p>
                    </div>

                    <label
                        htmlFor="private-note-file-input"
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); processIncomingFile(e.dataTransfer.files?.[0]); }}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${dropzoneStateClass}`}
                    >
                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-700 break-all">{selectedFile.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{computeByteSizeLabel(selectedFile.size)}</p>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setTitle(""); setFileError(""); }} className="text-xs text-slate-400 underline hover:text-slate-600">Choose different file</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Drop file here or <span className="text-amber-600">browse</span></p>
                                    <p className="text-xs text-slate-400 mt-1">PDF, Word, PPT, Excel, Images · Max 10MB</p>
                                </div>
                            </div>
                        )}
                        <input id="private-note-file-input" ref={fileInputRef} type="file" disabled={!!selectedFile} onChange={(e) => processIncomingFile(e.target.files?.[0])} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.txt" />
                    </label>

                    {fileError && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
                            <p className="text-xs text-red-600 font-medium">{fileError}</p>
                        </div>
                    )}

                    {selectedFile && (
                        <div>
                            <label htmlFor="private-note-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Title (optional)</label>
                            <input id="private-note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 2 Notes" className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 bg-slate-50 text-slate-800 font-medium" />
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} disabled={uploading} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                        <button type="button" disabled={!selectedFile || uploading || !!fileError} onClick={async () => { if (selectedFile) { const res = await onUpload(selectedFile, title); if (res?.success) onClose(); } }} className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 flex items-center justify-center gap-2 shadow-sm disabled:opacity-40">
                            {uploading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Uploading...</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>Upload Private File</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PrivateFileCard = ({ note, onDelete }: { note: any; onDelete: (id: string) => Promise<any> }) => {
    const [deleting, setDeleting] = useState(false);
    const cfg = ENUMERATED_FILE_MESSAGES[note.fileType as keyof typeof ENUMERATED_FILE_MESSAGES] || ENUMERATED_FILE_MESSAGES.other;

    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 hover:border-amber-200 hover:shadow-md transition-all duration-200">
            <div className={`rounded-xl flex flex-col items-center justify-center shrink-0 border p-2.5 ${cfg.bg} ${cfg.border}`} style={{ width: "52px", height: "52px" }}>
                <span className="text-xl leading-none">{cfg.icon}</span>
                <span className={`text-[8px] font-black tracking-wider mt-0.5 ${cfg.text}`}>{cfg.label}</span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 truncate">{note.title || note.fileName}</p>
                            {note.title && note.title !== note.fileName && <p className="text-xs text-slate-400 truncate mt-0.5">{note.fileName}</p>}
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Private
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">{computeByteSizeLabel(note.fileSize)} · {formatCustomDateString(note.createdAt)}</p>
                </div>

                <div className="flex gap-2 mt-3">
                    <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50" onClick={async () => {
                        try {
                            const res = await downloadFileAsBlob(note.fileUrl);
                            const b = await res.blob();
                            const el = document.createElement("a");
                            el.href = globalThis.URL.createObjectURL(b);
                            el.download = note.fileName || "download";
                            document.body.appendChild(el);
                            el.click();
                            el.remove();
                        } catch {
                            globalThis.open(note.fileUrl, "_blank");
                        }
                    }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Download
                    </button>
                    <button type="button" disabled={deleting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-white text-red-500 text-xs font-semibold hover:bg-red-50 disabled:opacity-50" onClick={async () => {
                        if (globalThis.confirm("Delete this file?")) {
                            setDeleting(true);
                            await onDelete(note._id);
                            setDeleting(false);
                        }
                    }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const NotepadEditor = ({ note, onSave, onDelete, onClose, saving }: { note: any; onSave: (id: string | undefined, title: string, content: string) => Promise<{ success: boolean } | undefined>; onDelete: (id: string) => void; onClose: () => void; saving: boolean }) => {
    const [title, setTitleState] = useState(note?.title || "");
    const [content, setContent] = useState(note?.content || "");
    const [dirty, setDirty] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally syncing local state from an external source (prop/URL), not derivable from render inputs alone
        setTitleState(note?.title || "");
        setContent(note?.content || "");
        setDirty(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
    }, [note?._id]);

    const commitSaveEvent = async () => {
        const result = await onSave(note?._id, title, content);
        if (result?.success) setDirty(false);
    };

    const dispatchTxtDownload = () => {
        const textBlob = new Blob([`${title}\n\n${content}`], { type: "text/plain" });
        const localUrl = URL.createObjectURL(textBlob);
        const element = document.createElement("a");
        element.href = localUrl;
        element.download = `${title || "note"}.txt`;
        document.body.appendChild(element);
        element.click();
        element.remove();
    };

    const dispatchPdfglobalThis = () => {
        const contextWindow = globalThis.open("", "_blank");
        if (!contextWindow) return;
        const doc = contextWindow.document;

        doc.title = title || "Note";

        const style = doc.createElement("style");
        style.textContent = `
    body{font-family:Georgia,serif;padding:48px;max-width:680px;margin:auto;color:#1e293b;line-height:1.7;}
    h1{font-size:24px;margin-bottom:28px;border-bottom:2px solid #e2e8f0;padding-bottom:16px;font-weight:700;}
    pre{white-space:pre-wrap;font-family:inherit;font-size:15px;}
  `;
        doc.head.appendChild(style);

        const heading = doc.createElement("h1");
        heading.textContent = title || "Untitled Note";

        const body = doc.createElement("pre");
        body.textContent = content;

        doc.body.appendChild(heading);
        doc.body.appendChild(body);

        contextWindow.print();
    };

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    return (
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm" style={{ height: "100%" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
                <input
                    value={title}
                    onChange={(e) => { setTitleState(e.target.value); setDirty(true); }}
                    placeholder="Note title..."
                    className="flex-1 text-base font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300 min-w-0 mr-4"
                />
                <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={dispatchTxtDownload} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white">.txt</button>
                    <button type="button" onClick={dispatchPdfglobalThis} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white">PDF</button>
                    <button type="button" onClick={commitSaveEvent} disabled={saving || !dirty} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${dirty ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                        {saving ? <><span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />Saving</> : <>Save</>}
                    </button>
                    {note?._id && (
                        <button type="button" onClick={() => onDelete(note._id)} className="p-2 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            </div>

            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => { setContent(e.target.value); setDirty(true); }}
                placeholder="Start writing your private note here…"
                className="flex-1 w-full px-6 py-5 text-sm text-slate-700 leading-relaxed resize-none outline-none placeholder:text-slate-300 font-medium overflow-y-auto"
            />

            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
                <span className="text-[11px] text-slate-500 font-medium">{wordCount} file word{wordCount === 1 ? "" : "s"} · {content.length} chars</span>
                {dirty && <span className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Unsaved changes</span>}
            </div>
        </div>
    );
};

export const NoteListItem = ({ note, isActive, onClick }: { note: any; isActive: boolean; onClick: () => void }) => {
    const contentPreviewSnippet = note.content?.trim()?.slice(0, 60) || "";
    return (
        <button type="button" onClick={onClick} className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 ${isActive ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
            <p className={`text-sm font-bold truncate ${isActive ? "text-blue-800" : "text-slate-700"}`}>{note.title || "Untitled Note"}</p>
            {contentPreviewSnippet && <p className="text-xs text-slate-400 mt-0.5 truncate">{contentPreviewSnippet}</p>}
            <p className={`text-[10px] mt-1 font-medium ${isActive ? "text-blue-400" : "text-slate-400"}`}>{formatCustomDateString(note.updatedAt)}</p>
        </button>
    );
};