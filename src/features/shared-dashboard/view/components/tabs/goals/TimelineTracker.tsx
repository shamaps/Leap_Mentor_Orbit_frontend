import { useState } from "react";

interface Goal {
  _id: string;
  startDate?: string | null;
  endDate?: string | null;
}

const formatDate = (d?: string | null): string | null =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : null;

const getProgress = (startDate?: string | null, endDate?: string | null): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate + "T00:00:00").getTime();
  const end = new Date(endDate + "T00:00:00").getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
};

const getDaysRemaining = (endDate?: string | null): number | null => {
  if (!endDate) return null;
  const diff = new Date(endDate + "T00:00:00").getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
const getDaysLeftColor = (daysLeft: number | null): string => {
  if (daysLeft === null) return "bg-green-50 text-green-600 border-green-200";
  if (daysLeft < 0) return "bg-red-50 text-red-500 border-red-200";
  if (daysLeft <= 7) return "bg-orange-50 text-orange-600 border-orange-200";
  return "bg-green-50 text-green-600 border-green-200";
};

const formatDaysLeftLabel = (daysLeft: number): string => {
  if (daysLeft < 0) return `Ended ${Math.abs(daysLeft)} days ago`;
  if (daysLeft === 0) return "Ends today";
  return `${daysLeft} days remaining`;
};
const today = new Date().toISOString().split("T")[0];

const TimelineTracker = ({
  goal,
  onUpdate,
  saving,
}: {
  goal?: Goal;
  onUpdate: (goalId: string, dates: { startDate: string; endDate: string }) => Promise<void>;
  saving?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(goal?.startDate || "");
  const [endDate, setEndDate] = useState(goal?.endDate || "");
  const [err, setErr] = useState("");

  const progress = getProgress(goal?.startDate, goal?.endDate);
  const daysLeft = getDaysRemaining(goal?.endDate);
  const hasTimeline = goal?.startDate && goal?.endDate;

  const handleSave = async () => {
    if (!goal) return;
    if (startDate && endDate && endDate < startDate) {
      setErr("End date cannot be before start date");
      return;
    }
    setErr("");
    await onUpdate(goal._id, { startDate, endDate });
    setEditing(false);
  };
  const daysLeftColor = getDaysLeftColor(daysLeft);
  let timelineContent;
  if (editing) {
    timelineContent = (
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="timeline-start-date" className="text-xs font-semibold text-slate-500 block mb-1.5">
              Start Date
            </label>
            <input
              id="timeline-start-date"
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="timeline-end-date" className="text-xs font-semibold text-slate-500 block mb-1.5">
              End Date
            </label>
            <input
              id="timeline-end-date"
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors"
            />
          </div>
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditing(false);
              setErr("");
            }}
            className="flex-1 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-blue-600 border-none text-xs font-bold text-white cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  } else if (hasTimeline) {
    timelineContent = (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-500">
            {formatDate(goal.startDate)}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {formatDate(goal.endDate)}
          </span>
        </div>
        <div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? "bg-green-500" : "bg-blue-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-right">
            {progress}% through engagement
          </p>
        </div>
        {daysLeft !== null && (
          <div className="flex justify-center">
            <span className={`text-xs font-bold px-3.5 py-1 rounded-full border ${daysLeftColor}`}>
              {formatDaysLeftLabel(daysLeft)}
            </span>
          </div>
        )}
      </div>
    );
  } else {
    timelineContent = (
      <p className="text-sm text-slate-400 text-center py-4">
        No timeline set. Click &apos;Set Timeline&apos; to add dates.
      </p>
    );
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      {/* Header */}

      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-2">

          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">

            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >

              <rect x="3" y="4" width="18" height="18" rx="2" />

              <line x1="16" y1="2" x2="16" y2="6" />

              <line x1="8" y1="2" x2="8" y2="6" />

              <line x1="3" y1="10" x2="21" y2="10" />

            </svg>

          </div>
          <p className="text-sm font-bold text-slate-800">Timeline</p>

        </div>
        {/* Both roles can set/edit timeline */}

        {!editing && (
          <button
            onClick={() => {
              setStartDate(goal?.startDate || "");
              setEndDate(goal?.endDate || "");
              setEditing(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer hover:border-blue-300 hover:text-blue-900 hover:bg-blue-50 transition-all"
          >

            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >

              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />

              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />

            </svg>
            {hasTimeline ? "Edit" : "Set Timeline"}

          </button>
        )}

      </div>
      {/* Edit form */}
      {timelineContent}

    </div>
  );
};

export default TimelineTracker;