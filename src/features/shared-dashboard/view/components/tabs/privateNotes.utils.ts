// src/features/shared-dashboard/view/components/tabs/privateNotes.utils.ts

export const computeByteSizeLabel = (byteCount?: number) => {
    if (!byteCount) return "—";
    const labelArray = ["Bytes", "KB", "MB"];
    const dynamicIndex = Math.floor(Math.log(byteCount) / Math.log(1024));
    return `${(byteCount / Math.pow(1024, dynamicIndex)).toFixed(1)} ${labelArray[dynamicIndex]}`;
};

export const formatCustomDateString = (isoTimestamp?: string) => {
    if (!isoTimestamp) return "";
    const dateObj = new Date(isoTimestamp);
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const generateDateHeader = (targetTimestamp: string) => {
    const parsedTarget = new Date(targetTimestamp).toDateString();
    const runtimeInstant = new Date();
    if (parsedTarget === runtimeInstant.toDateString()) return "Today";
    runtimeInstant.setDate(runtimeInstant.getDate() - 1);
    return parsedTarget === runtimeInstant.toDateString() ? "Yesterday" : new Date(targetTimestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export const ENUMERATED_FILE_MESSAGES = {
    pdf: { label: "PDF", bg: "bg-red-100", text: "text-red-600", border: "border-red-200", icon: "📄" },
    image: { label: "IMG", bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200", icon: "🖼️" },
    doc: { label: "DOC", bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200", icon: "📝" },
    ppt: { label: "PPT", bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200", icon: "📊" },
    excel: { label: "XLS", bg: "bg-green-100", text: "text-green-600", border: "border-green-200", icon: "📈" },
    txt: { label: "TXT", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: "📃" },
    other: { label: "FILE", bg: "bg-violet-100", text: "text-violet-600", border: "border-violet-200", icon: "📎" },
};

export const VALID_MIME_STRINGS = new Set([
    "application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"
]);

export const SKELETON_SLOT_IDS = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"];