// components/mentor/dashboard/MentorshipPrefsCard.jsx
import { useSelector } from "react-redux";
import { selectMentorProfile } from "@/app/store/selectors";
import { COMM_ICONS } from "@/shared/constants/mentorshipPrefs";
import PrefsCardHeader from "@/shared/components/PrefsCardHeader";
import PropTypes from "prop-types";
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
      <PrefsCardHeader />
      <div className="space-y-4">
        {/* Communication Channels */}
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">
            Communication Channels
          </p>
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
MentorshipPrefsCard.propTypes = {
  profile: PropTypes.shape({
    communicationPreferences: PropTypes.arrayOf(PropTypes.string),
    languages: PropTypes.arrayOf(PropTypes.string),
  }),
  variant: PropTypes.string,
};
export default MentorshipPrefsCard;