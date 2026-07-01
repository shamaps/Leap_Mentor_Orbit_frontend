// components/mentor/dashboard/MentorshipPrefsCard.jsx
import { useSelector } from "react-redux";
import { selectMentorProfile } from "../../../store/selectors";
const COMM_ICONS = {
  "Video Call": "🎥",
  "Chat": "💬",
  "Email": "✉️",
  "Phone Call": "📞",
  "In-Person": "🤝",
};

// `profile` prop is an optional override — used by the mentee ProfileTab
// (chain #4) which hasn't been migrated to Redux yet. When omitted (mentor
// ProfileTab, already migrated), falls back to the mentor Redux slice.
const MentorshipPrefsCard = ({ profile: profileProp, variant }) => {
  const { profile: profileFromStore } = useSelector(selectMentorProfile);
  const profile = profileProp ?? profileFromStore;
  const commPrefs = profile?.communicationPreferences || [];
  const languages = profile?.languages || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Mentorship Preferences</h3>
      </div>

      <div className="space-y-4">
        {/* Communication Channels */}
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">Communication Channels</p>
          {commPrefs.length === 0 ? (
            <p className="text-sm text-slate-500">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {commPrefs.map((pref) => (
                <span
                  key={pref}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  <span>{COMM_ICONS[pref] || "💬"}</span>
                  {pref}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Languages */}
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Languages</p>
          <p className="text-sm font-semibold text-slate-700">
            {languages.length > 0 ? languages.join(", ") : "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentorshipPrefsCard;