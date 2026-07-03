// components/mentor/dashboard/ProfileTab.jsx
import { useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import ProfessionalInfoCard from "./ProfessionalInfoCard";
import SkillsCard from "./SkillsCard";
import MentorshipPrefsCard from "./MentorshipPrefsCard";
import SocialCard from "./SocialCard";

const ProfileTab = ({ user, profile }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Mentor Dashboard
          </h1>
          <p className="text-sm text-blue-900 mt-0.5">
            Manage your professional identity and preferences.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/mentor/edit-profile")} // ✅ FIXED: was "/onboarding/mentor"
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-900 text-white hover:bg-blue-700 transition-colors duration-150 shadow-sm"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Profile
        </button>
      </div>

      {/* Profile hero card */}
      <ProfileCard
        user={user}
        profile={profile}
        onEditClick={() => navigate("/dashboard/mentor/edit-profile")} // ✅ FIXED: was "/onboarding/mentor"
      />

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProfessionalInfoCard profile={profile} />
        <SkillsCard profile={profile} />
        <MentorshipPrefsCard profile={profile} variant="mentor" />
        <SocialCard profile={profile} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <p className="text-xs text-slate-600">
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
