// src/components/shared-dashboard/tabs/goals/MilestoneList.jsx
import { useState } from "react";

const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();
const formatDate = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

// ── Milestone Progress Bar ────────────────────────────────────
const MilestoneProgress = ({ completed, total }) => {
  if (total === 0) return null;

  const percent = Math.round((completed / total) * 100);
  const allDone = completed === total;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-slate-500">
          {completed} of {total} milestone{total !== 1 ? "s" : ""} completed
        </p>
        <p
          className={`text-xs font-bold ${allDone ? "text-green-600" : "text-violet-600"}`}
        >
          {percent}%
        </p>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500
            ${allDone ? "bg-green-500" : "bg-violet-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {allDone && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-green-600">
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          All milestones completed!
        </div>
      )}
    </div>
  );
};

// ── Add Milestone Form ────────────────────────────────────────
const AddMilestoneForm = ({ onAdd, onCancel, saving }) => {
  const [title, setTitle] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) return;
    await onAdd({ title: title.trim() });
    setTitle("");
  };

  return (
    <div className="bg-slate-50 border border-dashed border-violet-300 rounded-xl p-3.5 flex flex-col gap-2.5 mb-2">
      <div className="flex gap-2.5 items-center">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Milestone title..."
          className="flex-1 px-3 py-2 border border-violet-200 rounded-lg text-sm text-slate-800
            bg-white outline-none focus:border-violet-500 transition-colors placeholder:text-slate-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs
            font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!title.trim() || saving}
          className={`px-3.5 py-1.5 rounded-lg border-none text-xs font-bold transition-colors
            ${
              title.trim() && !saving
                ? "bg-violet-600 text-white cursor-pointer hover:bg-violet-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
};

// ── Delete Confirmation Modal ─────────────────────────────────
const DeleteMilestoneModal = ({ milestone, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-base font-extrabold text-slate-800 mb-1">
        Delete Milestone?
      </h3>
      <p className="text-sm text-slate-500 mb-5">
        <span className="font-semibold text-slate-700">
          "{milestone.title}"
        </span>{" "}
        will be permanently removed from this goal.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold
            text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-xl bg-blue-900 border-none text-sm font-bold
            text-white hover:bg-blue-900 transition-all cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Milestone Row ─────────────────────────────────────────────
const MilestoneRow = ({ milestone, onToggle, onRequestDelete }) => {
  const overdue = !milestone.isCompleted && isOverdue(milestone.dueDate);

  const dueBadgeClass = milestone.isCompleted
    ? "bg-slate-100 text-slate-400 border-slate-200"
    : overdue
      ? "bg-red-50 text-red-500 border-red-200"
      : "bg-violet-50 text-violet-600 border-violet-200";

  return (
    <div
      className={`flex items-center gap-3 px-3.5 py-3 border border-slate-200 rounded-xl mb-1.5 transition-all
      ${milestone.isCompleted ? "bg-slate-50 opacity-75" : "bg-white"}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(milestone._id, !milestone.isCompleted)}
        className={`w-5 h-5 rounded-md shrink-0 border-2 flex items-center justify-center
          transition-all cursor-pointer p-0
          ${
            milestone.isCompleted
              ? "bg-violet-600 border-violet-600"
              : "bg-white border-slate-300 hover:border-violet-400"
          }`}
      >
        {milestone.isCompleted && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        className={`flex-1 text-sm font-medium leading-snug
        ${milestone.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}
      >
        {milestone.title}
      </span>

      {/* Due date */}
      {milestone.dueDate && (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${dueBadgeClass}`}
        >
          {overdue && !milestone.isCompleted ? "Overdue · " : ""}
          {formatDate(milestone.dueDate)}
        </span>
      )}

      {/* Delete — now opens modal instead of window.confirm */}
      <button
        onClick={() => onRequestDelete(milestone)}
        className="p-1 rounded-md border-none bg-transparent text-slate-600 hover:text-red-400
          transition-colors cursor-pointer shrink-0 flex items-center"
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
      </button>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────
const MilestoneList = ({
  goal,
  milestones,
  saving,
  onAdd,
  onToggle,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);

  const completed = milestones.filter((m) => m.isCompleted);
  const pending = milestones.filter((m) => !m.isCompleted);
  const sorted = [...pending, ...completed];

  const handleAdd = async (data) => {
    const result = await onAdd(goal._id, data);
    if (result?.success) setShowForm(false);
  };

  const handleDeleteConfirm = async () => {
    await onDelete(milestoneToDelete._id);
    setMilestoneToDelete(null);
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-bold text-slate-800 m-0">Milestones</p>
            {milestones.length > 0 && (
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border
                ${
                  completed.length === milestones.length
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-violet-50 text-violet-600 border-violet-200"
                }`}
              >
                {completed.length} / {milestones.length}
              </span>
            )}
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50
                border border-violet-200 text-xs font-bold text-violet-600 cursor-pointer
                hover:bg-violet-100 transition-colors"
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Milestone
            </button>
          )}
        </div>

        {/* Progress bar */}
        <MilestoneProgress
          completed={completed.length}
          total={milestones.length}
        />

        {/* Add form */}
        {showForm && (
          <AddMilestoneForm
            onAdd={handleAdd}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        )}

        {/* Empty state */}
        {milestones.length === 0 && !showForm && (
          <div className="text-center py-7">
            <p className="text-sm font-semibold text-slate-700 mb-1">
              No milestones yet
            </p>
            <p className="text-xs text-slate-600">
              Break your goal into smaller, checkable steps.
            </p>
          </div>
        )}

        {/* Milestone rows */}
        {sorted.map((m) => (
          <MilestoneRow
            key={m._id}
            milestone={m}
            onToggle={onToggle}
            onRequestDelete={setMilestoneToDelete}
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      {milestoneToDelete && (
        <DeleteMilestoneModal
          milestone={milestoneToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setMilestoneToDelete(null)}
        />
      )}
    </>
  );
};

export default MilestoneList;
