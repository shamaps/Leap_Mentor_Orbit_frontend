/**
 * Shared utility functions for notes functionality
 */

export const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateSeparator = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// ← REMOVED getMyId() — was reading token from localStorage which is always null now.
// userId is now passed as a parameter from the component which reads it from Redux.

export const getFileType = (fileName) => {
  if (!fileName) return "other";
  const ext = fileName.split(".").pop().toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (ext === "txt") return "txt";
  return "other";
};

export const ALLOWED_FILE_TYPES = [
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

export const FILE_ICON_STYLES = {
  pdf: "bg-red-100 text-red-600",
  image: "bg-green-100 text-green-600",
  doc: "bg-blue-100 text-blue-600",
  ppt: "bg-orange-100 text-orange-600",
  excel: "bg-emerald-100 text-emerald-600",
  txt: "bg-slate-100 text-slate-600",
  other: "bg-violet-100 text-violet-600",
};

export const FILE_ICON_LABELS = {
  pdf: "PDF",
  image: "IMG",
  doc: "DOC",
  ppt: "PPT",
  excel: "XLS",
  txt: "TXT",
  other: "FILE",
};