import { useState } from "react";
import Spinner from "../../../common/Spinner";
const GoalForm = ({ initial = {}, onSave, onCancel, saving }) => {
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [startDate, setStartDate] = useState(initial.startDate || "");
  const [endDate, setEndDate] = useState(initial.endDate || "");
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setErr("Goal title is required");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setErr("End date cannot be before start date");
      return;
    }
    setErr("");
    await onSave({
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
          Goal Title <span className="text-red-400">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Land a frontend role at a product startup"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white outline-none focus:border-blue-300 transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
          Description{" "}
          <span className="text-xs text-slate-400 normal-case font-normal">
            (optional)
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what success looks like..."
          rows={3}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white outline-none focus:border-blue-300 transition-colors resize-vertical leading-relaxed placeholder:text-slate-400"
        />
      </div>

      {/* Dates */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none focus:border-blue-300 transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none focus:border-blue-300 transition-colors"
          />
        </div>
      </div>

      {/* Error */}
      {err && <p className="text-xs text-red-500 m-0">{err}</p>}

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className={`flex-1 py-2.5 rounded-xl border-none text-xs font-bold transition-colors flex items-center justify-center gap-1.5
            ${
              title.trim() && !saving
                ? "bg-violet-600 text-white cursor-pointer hover:bg-violet-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
        >
          {saving ? <><Spinner size="sm" light />Saving...</> : (
            "Save Goal"
          )}
        </button>
      </div>
    </div>
  );
};

export default GoalForm;
