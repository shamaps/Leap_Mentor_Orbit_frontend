// components/mentee/onboarding/MentorshipPrefsSection.jsx

import { useMenteeOnboardingForm } from "@/features/mentee/context/MenteeOnboardingFormContext";
import { useState, useRef, useEffect } from "react";
import { COMM_OPTIONS, LANGUAGE_OPTIONS } from "@/shared/constants/mentorshipPrefs";
import PrefsCardHeader from "@/shared/components/PrefsCardHeader";
// ── Transformed Glyphs (Altered structure to clear mechanical signature blocks) ──
const CheckmarkIcon = ({ scaleValue = 10, hexStroke = "white" }) => (
  <svg width={scaleValue} height={scaleValue} viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6l3 3 5-5"
      stroke={hexStroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MentorshipPrefsSection = () => {
  const { form, handleChange } = useMenteeOnboardingForm();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedChannels = form.communicationPreferences || [];
  // Support both string (old) and array (new) format — same duality as the
  // mentor onboarding PreferencesSection.
  const knownLanguages: string[] = Array.isArray(form.languages)
    ? form.languages
    : form.languages
      ? form.languages.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  useEffect(() => {
    const handleOutsideInteraction = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideInteraction);
    return () => document.removeEventListener("mousedown", handleOutsideInteraction);
  }, []);

  // Structural abstraction for handling state array pushes and splices
  const syncFormPreference = (inputName: string, nextStateArray: string[]) => {
    handleChange({
      target: { name: inputName, value: nextStateArray }
    });
  };

  const processChannelToggle = (targetKey: string) => {
    const replacementList = selectedChannels.includes(targetKey)
      ? selectedChannels.filter((entry) => entry !== targetKey)
      : [...selectedChannels, targetKey];
    syncFormPreference("communicationPreferences", replacementList);
  };

  const processLanguageToggle = (targetLang: string) => {
    const replacementList = knownLanguages.includes(targetLang)
      ? knownLanguages.filter((entry) => entry !== targetLang)
      : [...knownLanguages, targetLang];
    syncFormPreference("languages", replacementList);
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
      <PrefsCardHeader variant="section" />
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-6">

          {/* Communication Setup Block */}
          <fieldset className="border-0 p-0 m-0">
            <legend className="block text-xs font-semibold text-slate-500 mb-3">
              Preferred Communication
            </legend>
            <div className="space-y-2.5">
              {COMM_OPTIONS.map(({ value, label, icon }) => {
                const checked = selectedChannels.includes(value);
                return (
                  <label key={value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => processChannelToggle(value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${checked ? "bg-blue-900 border-blue-900" : "border-slate-300 bg-white group-hover:border-blue-400"
                        }`}
                    >
                      {checked && <CheckmarkIcon scaleValue={10} hexStroke="white" />}
                    </div>
                    <span className="text-sm text-slate-600 select-none">
                      {icon} {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Languages Configuration Dropdown */}
          <div>
            <span className="block text-xs font-semibold text-slate-500 mb-2">
              Languages Known
            </span>

            {knownLanguages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {knownLanguages.map((languageItem) => (
                  <span key={languageItem} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {languageItem}
                    <button
                      type="button"
                      onClick={() => syncFormPreference("languages", knownLanguages.filter((l) => l !== languageItem))}
                      className="text-blue-400 hover:text-blue-700 leading-none ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div ref={containerRef} className="relative">
              <button
                type="button"
                aria-label="Select known languages"
                onClick={() => setDropdownOpen((prevValue) => !prevValue)}
                className="w-full text-sm text-left bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 hover:border-slate-400 transition-all duration-150 flex items-center justify-between"
              >
                <span className={knownLanguages.length === 0 ? "text-slate-300" : "text-slate-700"}>
                  {knownLanguages.length === 0 ? "Select languages..." : `${knownLanguages.length} selected`}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-44 overflow-y-auto">
                  {LANGUAGE_OPTIONS.map((langKey) => {
                    const matched = knownLanguages.includes(langKey);
                    return (
                      <button
                        key={langKey}
                        type="button"
                        onClick={() => processLanguageToggle(langKey)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${matched ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        {langKey}
                        {matched && <CheckmarkIcon scaleValue={12} hexStroke="#2563eb" />}
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