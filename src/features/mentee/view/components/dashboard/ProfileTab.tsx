// components/mentee/dashboard/ProfileTab.jsx
import { useSelector } from "react-redux";
import ProfileHeroCard from "./ProfileHeroCard";
import ProfessionalDetailsCard from "./ProfessionalDetailsCard";
import InterestedFieldsCard from "./InterestedFieldsCard";
import MentorshipPrefsCard from "@/features/mentor/view/components/dashboard/MentorshipPrefsCard";
// MentorshipPrefsCard belongs to the mentor feature, still plain JS (a later
// phase); its inferred prop types mark every prop as required. Cast locally
// to avoid coupling this migration to that one.
 
const MentorshipPrefsCardAny = MentorshipPrefsCard as any;
import SocialPresenceCard from "./SocialPresenceCard";
import { selectMenteeProfile } from "@/app/store/selectors";
const ProfileTab = () => {
  const { user, profile } = useSelector(selectMenteeProfile);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Mentee Dashboard
          </h1>
          <p className="text-sm text-blue-900 mt-0.5">
            Manage your professional identity and preferences.
          </p>
        </div>
      </div>
      {/* Hero Card */}
      <ProfileHeroCard user={user} profile={profile} />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProfessionalDetailsCard profile={profile} />
        <MentorshipPrefsCardAny profile={profile} />
        <InterestedFieldsCard profile={profile} />
        <SocialPresenceCard profile={profile} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <p className="text-xs text-slate-400">
          Last profile update:{" "}
          {profile?.updatedAt
            ? new Date(profile.updatedAt as string | number | Date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            : "—"}
        </p>
      </div>
    </div>
  );
};

export default ProfileTab;