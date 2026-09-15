// components/mentor/dashboard/MentorshipPrefsCard.tsx
import { useSelector } from "react-redux";
import { selectMentorProfile } from "@/app/store/selectors";
import { COMM_ICONS } from "@/shared/constants/mentorshipPrefs";
import PrefsCardHeader from "@/shared/components/PrefsCardHeader";

interface MentorshipPrefsCardProfile {
  communicationPreferences?: string[];
  languages?: string[];
}

interface MentorshipPrefsCardProps {
  profile?: MentorshipPrefsCardProfile | null;
  variant?: string;
}

const MentorshipPrefsCard = ({ profile, variant }: MentorshipPrefsCardProps) => {
  const { profile: reduxProfile } = useSelector(selectMentorProfile);
  const activeProfile: MentorshipPrefsCardProfile = profile ?? reduxProfile ?? {};
  const communicationPreferences = activeProfile.communicationPreferences ?? [];
  const languages = activeProfile.languages ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <PrefsCardHeader variant={variant} />

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-2">
            Communication Channels
          </p>
          {communicationPreferences.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {communicationPreferences.map((pref: string) => (
                <span
                  key={pref}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-900 px-3 py-1.5 rounded-full border border-blue-100"
                >
                  {COMM_ICONS[pref] ?? "💬"} {pref}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-400 font-medium mb-2">Languages</p>
          <p className="text-sm font-semibold text-slate-700">
            {languages.length === 0 ? "—" : languages.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentorshipPrefsCard;