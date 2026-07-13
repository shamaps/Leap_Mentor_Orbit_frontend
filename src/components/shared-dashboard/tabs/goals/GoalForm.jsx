import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Spinner from "../../../common/Spinner";
import PropTypes from "prop-types";
import { goalSchema } from "../../../../schemas/miscSchemas";

const GoalForm = ({ initial = {}, onSave, onCancel, saving }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: initial.title || "",
      description: initial.description || "",
      startDate: initial.startDate || "",
      endDate: initial.endDate || "",
    },
  });

  const watchedTitle = watch("title");

  // zodResolver has already validated the title + date-order rules by
  // the time this runs — no manual checks needed.
  const onSubmit = async (data) => {
    await onSave({
      title: data.title.trim(),
      description: (data.description || "").trim(),
      startDate: data.startDate,
      endDate: data.endDate,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Title */}
      <div>
        <label htmlFor="goal-title" className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
          Goal Title <span className="text-red-400">*</span>
        </label>
        <input
          id="goal-title"
          placeholder="e.g. Land a frontend role at a product startup"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white outline-none focus:border-blue-300 transition-colors placeholder:text-slate-400"
          {...register("title")}
        />
        {errors.title?.message && (
          <p className="text-xs text-red-500 mt-1.5">{errors.title.message}</p>
        )}
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
          placeholder="Describe what success looks like..."
          rows={3}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white outline-none focus:border-blue-300 transition-colors resize-vertical leading-relaxed placeholder:text-slate-400"
          {...register("description")}
        />
      </div>

      {/* Dates */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="goal-start-date" className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
            Start Date
          </label>
          <input
            id="goal-start-date"
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none focus:border-blue-300 transition-colors"
            {...register("startDate")}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="goal-end-date" className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
            End Date
          </label>
          <input
            id="goal-end-date"
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none focus:border-blue-300 transition-colors"
            {...register("endDate")}
          />
          {errors.endDate?.message && (
            <p className="text-xs text-red-500 mt-1.5">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !watchedTitle?.trim()}
          className={`flex-1 py-2.5 rounded-xl border-none text-xs font-bold transition-colors flex items-center justify-center gap-1.5
            ${watchedTitle?.trim() && !saving
              ? "bg-violet-600 text-white cursor-pointer hover:bg-violet-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
        >
          {saving ? <><Spinner size="sm" light />Saving...</> : (
            "Save Goal"
          )}
        </button>
      </div>
    </form>
  );
};
GoalForm.propTypes = {
  initial: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
export default GoalForm;