// components/mentor/dashboard/ProfileCard.jsx
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectMentorProfile } from "@/app/store/selectors";
import { useState } from "react";
const ProfileCard = () => {
  const navigate = useNavigate();
  const { user, profile } = useSelector(selectMentorProfile);
  const [imgError, setImgError] = useState(false);
  const isVerified = profile?.verificationStatus === "verified";
  const isPending = profile?.verificationStatus === "pending";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 overflow-hidden border-2 border-blue-100">
            {profile?.profilePicture && !imgError ? (
              <img
                src={profile.profilePicture}
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
          {/* Camera icon overlay */}
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center shadow-sm">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {user?.name || "—"}
            </h2>

            {/* Verification badge */}
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Verified
              </span>
            )}

            {isPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-600 border border-yellow-200">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Under Review
              </span>
            )}

            {!isVerified && !isPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Unverified
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-0.5">
            {profile?.currentRole || "—"}
            {profile?.company ? ` & ${profile.company}` : ""}
          </p>

          {profile?.bio && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
                BIO
              </p>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Upload button — only when truly unverified, not pending or verified */}
          {!isVerified && !isPending && (
            <button
              onClick={() => navigate("/onboarding/mentor/verify-documents")}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Verification Documents
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;