// components/mentee/onboarding/MentorshipPrefsSection.jsx
import { useMenteeOnboardingForm } from "../../../context/MenteeOnboardingFormContext";
import { useState, useRef, useEffect } from "react";
import { COMM_OPTIONS, LANGUAGE_OPTIONS } from "../../../constants/mentorshipPrefs";
import PrefsCardHeader from "../../common/PrefsCardHeader";

const MentorshipPrefsSection = () => {
  const { form, handleChange } = useMenteeOnboardingForm();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = form.communicationPreferences || [];
  const languages = form.languages || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleComm = (value) => {
    const updated = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    handleChange({
      target: { name: "communicationPreferences", value: updated },
    });
  };

  const toggleLanguage = (lang) => {
    const updated = languages.includes(lang)
      ? languages.filter((l) => l !== lang)
      : [...languages, lang];
    handleChange({ target: { name: "languages", value: updated } });
  };

  const removeLanguage = (lang) => {
    handleChange({
      target: { name: "languages", value: languages.filter((l) => l !== lang) },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
      <PrefsCardHeader variant="section" />
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-6">
          {/* Communication */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-3">
              Preferred Communication
            </label>
            <div className="space-y-2.5">
              {COMM_OPTIONS.map(({ value, label, icon }) => {
                const isChecked = selected.includes(value);
                return (
                  <label
                    key={value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      onClick={() => toggleComm(value)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
                        isChecked
                          ? "bg-blue-900 border-blue-900"
                          : "border-slate-300 bg-white group-hover:border-blue-400"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      onClick={() => toggleComm(value)}
                      className="text-sm text-slate-600 select-none"
                    >
                      {icon} {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Languages — dropdown multi-select */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Languages Known
            </label>

            {/* Selected language tags */}
            {languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="text-blue-400 hover:text-blue-700 leading-none ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown trigger */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-full text-sm text-left bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 hover:border-slate-400 transition-all duration-150 flex items-center justify-between"
              >
                <span
                  className={
                    languages.length === 0 ? "text-slate-300" : "text-slate-700"
                  }
                >
                  {languages.length === 0
                    ? "Select languages..."
                    : `${languages.length} selected`}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown list */}
              {dropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-44 overflow-y-auto">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {lang}
                        {isSelected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="#2563eb"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorshipPrefsSection;
