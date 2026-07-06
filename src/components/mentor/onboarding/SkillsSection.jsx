// components/mentor/onboarding/SkillsSection.jsx
import { useState, forwardRef } from "react";
import { useMentorOnboardingForm } from "../../../context/MentorOnboardingFormContext";

const SkillsSection = forwardRef((_, ref) => {
  const { form, onChange, onBlur, errors = {} } = useMentorOnboardingForm();
  const [input, setInput] = useState("");
  const hasError = errors.skills;

  const addSkill = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const current = form.skills || [];
    if (current.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange({ target: { name: "skills", value: [...current, trimmed] } });
    setInput("");
  };

  const removeSkill = (skill) => {
    onChange({
      target: {
        name: "skills",
        value: (form.skills || []).filter((s) => s !== skill),
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    // ref + data-field both attached so scrollToFirstError can find this
    // section via either the React ref or a DOM querySelector fallback
    <div
      ref={ref}
      data-field="skills"
      className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50">
        <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-800">Skills & Expertise</h2>
      </div>

      <div className="px-6 py-5">
        <label className="block text-xs font-semibold text-slate-500 mb-2">
          Core Skills <span className="text-blue-900">*</span>
        </label>

        {(form.skills || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.skills || []).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="w-3.5 h-3.5 rounded-full bg-blue-300 hover:bg-blue-900 text-white flex items-center justify-center transition-colors duration-150 text-[10px] leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addSkill}
            placeholder="Type a skill and press enter..."
            className={`flex-1 text-sm text-slate-800 bg-white border rounded-xl px-3.5 py-2.5 outline-none placeholder:text-slate-400 focus:ring-2 transition-all duration-150 hover:border-slate-400 ${
              hasError
                ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100"
                : "border-slate-300 focus:border-blue-400 focus:ring-blue-100"
            }`}
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-[#1d4ed8] transition-colors duration-150"
          >
            Add
          </button>
        </div>

        {hasError ? (
          <p className="text-xs text-red-400 mt-1.5">
            Please add at least one skill.
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-1.5">
            Press Enter or click Add to add a skill
          </p>
        )}
      </div>
    </div>
  );
});

SkillsSection.displayName = "SkillsSection";
export default SkillsSection;
