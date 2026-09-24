// components/mentee/dashboard/ProfileHeroCard.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { MenteeUser } from "@/app/store/slices/menteeProfileSlice";

interface ProfileHeroCardProps {
  user?: MenteeUser | null;
  profile?: Record<string, unknown> | null;
}

const ProfileHeroCard = ({ user, profile }: ProfileHeroCardProps) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const profilePicture160 = profile?.profilePicture160 as string | undefined;
  const profilePicture = profile?.profilePicture as string | undefined;
  const bio = profile?.bio as string | undefined;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-24 h-24 rounded-full bg-blue-100 overflow-hidden border-2 border-blue-100">
            {profilePicture && !imgError ? (
              <img
                src={profilePicture160 || profilePicture}
                alt={user?.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-400 text-2xl font-bold">
                {user?.name?.[0]?.toUpperCase() || "M"}
              </div>
            )}
          </div>
        </div>

        {/* Right: Name + Bio label + Bio text + Buttons */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h2 className="text-xl font-bold text-slate-800 leading-tight">
            {user?.name || "—"}
          </h2>

          {/* Bio label */}
          <p className="text-sm text-slate-500 mt-1 font-medium">Bio</p>

          {/* Bio text */}
          {bio && (
            <p className="text-sm text-slate-600 leading-relaxed mt-1 line-clamp-3">
              {bio}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => navigate("/dashboard/mentee/edit-profile")}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border bg-slate-900 text-slate-300 hover:border-blue-300 hover:text-blue-900 hover:bg-blue-50 transition-all duration-150"
            >
              <svg
                width="12"
                height="12"
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
        </div>
      </div>
    </div>
  );
};

export default ProfileHeroCard;