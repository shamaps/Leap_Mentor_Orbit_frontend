// src/components/ui/OnboardingProgressBar.jsx
interface OnboardingField {
  key: string;
  type?: string;
}

interface OnboardingProgressBarProps {
  form: Record<string, unknown>;
  fields: OnboardingField[];
}

const OnboardingProgressBar = ({ form, fields }: OnboardingProgressBarProps) => {
  const filled = fields.filter(({ key, type }) => {
    const val = form[key];
    if (type === "array") return Array.isArray(val) && val.length > 0;
    return val !== "" && val !== null && val !== undefined;
  });

  const percent = Math.round((filled.length / fields.length) * 100);

  const getBarColor = (percent: number): string => {
    if (percent < 40) return "#3b82f6";
    if (percent < 75) return "#8b5cf6";
    return "#10b981";
  };
  const bar = getBarColor(percent);
  return (
    <div className="sticky top-14 z-10 bg-white border-b border-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-2.5 flex items-center gap-4">
        {/* Label */}
        <span className="text-xs font-semibold text-slate-500 shrink-0">
          Profile Completion
        </span>

        {/* Track */}
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${bar}bb, ${bar})`,
            }}
          />
        </div>

        {/* Percent */}
        <span
          className="text-xs font-bold tabular-nums shrink-0"
          style={{ color: bar }}
        >
          {percent === 100 ? "✓ Complete" : `${percent}%`}
        </span>
      </div>
    </div>
  );
};
export default OnboardingProgressBar;