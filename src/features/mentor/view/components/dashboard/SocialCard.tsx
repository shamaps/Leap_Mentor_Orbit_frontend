// components/mentor/dashboard/SocialCard.jsx
interface SocialCardProps {
  profile?: { portfolioUrl?: string; linkedInUrl?: string } | null;
}

const SocialCard = ({ profile }: SocialCardProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Social & Web</h3>
      </div>

      <div className="space-y-3">
        {/* Portfolio */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-600 font-medium">Portfolio</p>
            {profile?.portfolioUrl ? (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-blue-900 hover:underline truncate block"
              >
                {profile.portfolioUrl.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <p className="text-sm text-slate-600">—</p>
            )}
          </div>
        </div>

        {/* LinkedIn */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-600 font-medium">
              LinkedIn Profile
            </p>
            {profile?.linkedInUrl ? (
              <a
                href={profile.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-blue-900 hover:underline truncate block"
              >
                {profile.linkedInUrl.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <p className="text-sm text-slate-600">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialCard;