// components/mentee/dashboard/ProfileTab.jsx
import { useSelector } from "react-redux";
import ProfileHeroCard from "./ProfileHeroCard";
import ProfessionalDetailsCard from "./ProfessionalDetailsCard";
import InterestedFieldsCard from "./InterestedFieldsCard";
import MentorshipPrefsCard from "@/components/mentor/dashboard/MentorshipPrefsCard";
import SocialPresenceCard from "./SocialPresenceCard";
import { selectMenteeProfile } from "../../../store/selectors";
const ProfileTab = () => {
  const { profile } = useSelector(selectMenteeProfile);
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
      <ProfileHeroCard />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProfessionalDetailsCard />
        <MentorshipPrefsCard profile={profile} />
        <InterestedFieldsCard />
        <SocialPresenceCard />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <p className="text-xs text-slate-400">
          Last profile update:{" "}
          {profile?.updatedAt
            ? new Date(profile.updatedAt).toLocaleDateString("en-US", {
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
