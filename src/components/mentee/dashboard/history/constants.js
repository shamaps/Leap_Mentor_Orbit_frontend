// src/components/mentee/dashboard/history/constants.js

export const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "referred", label: "Referred" },
];

export const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-600 border border-amber-200",
  accepted: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  rejected: "bg-red-50 text-red-500 border border-red-200",
  referred: "bg-violet-50 text-violet-600 border border-violet-200",
  ongoing: "bg-blue-50 text-blue-900 border border-blue-200",
  completed: "bg-slate-100 text-slate-600 border border-slate-200",
};

export const STATUS_LABELS = {
  pending: "⏳ Waiting for mentor response",
  accepted: "Mentor accepted — payment required",
  rejected: "❌ Mentor declined your request",
  referred: "↪️ Referred to another mentor",
  ongoing: "🔵 Session in progress — payment held in escrow",
  completed: "🎓 Session completed — tokens released to mentor",
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

export const getInitials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
