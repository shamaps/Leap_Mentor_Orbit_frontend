// components/mentee/dashboard/ProfileTab.jsx
import ProfileHeroCard from "./ProfileHeroCard";
import ProfessionalDetailsCard from "./ProfessionalDetailsCard";
import InterestedFieldsCard from "./InterestedFieldsCard";
import MentorshipPrefsCard from "@/components/molecules/MentorshipPrefsCard";
import SocialPresenceCard from "./SocialPresenceCard";

const ProfileTab = ({ user, profile }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mentee Dashboard</h1>
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
        <MentorshipPrefsCard profile={profile} />
        <InterestedFieldsCard profile={profile} />
        <SocialPresenceCard profile={profile} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <p className="text-xs text-slate-400">
          Last profile update:{" "}
          {profile?.updatedAt
            ? new Date(profile.updatedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })
            : "—"}
        </p>

      </div>
    </div>
  );
};

export default ProfileTab;