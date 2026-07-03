// src/components/mentor/dashboard/requests/ReferredByProfileModal.jsx

const StarRating = ({ rating }) => {
  const r = Number(rating) || 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= Math.round(r) ? "#FBBF24" : "none"}
          stroke={star <= Math.round(r) ? "#FBBF24" : "#CBD5E1"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-sm font-semibold text-slate-700 ml-1">
        {r > 0 ? r.toFixed(1) : "New"}
      </span>
    </div>
  );
};

// ── Read-only Mentor Profile Modal ────────────────────────────
const ReferredByProfileModal = ({ mentor, onClose }) => {
  if (!mentor) return null;

  const {
    name,
    email,
    currentRole,
    company,
    industry,
    bio,
    hourlyRate,
    avgRating,
    yearsOfExperience,
    profilePicture,
    skills = [],
  } = mentor;

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {name || "—"}
              </h2>
              <p className="text-sm text-amber-600 font-semibold">
                {currentRole}
                {company ? ` at ${company}` : ""}
              </p>
              {email && (
                <p className="text-xs text-slate-400 mt-0.5">{email}</p>
              )}
              {bio && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {bio}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 ml-2 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748B"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* ── Referred by banner ── */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            </svg>
            <p className="text-xs text-amber-700 font-semibold">
              This mentor referred this request to you
            </p>
          </div>

          {/* ── Rate + Rating ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Hourly Rate
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {hourlyRate ? `$${hourlyRate}` : "Free"}
                <span className="text-sm font-medium text-slate-400"> /hr</span>
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Rating
              </p>
              <StarRating rating={avgRating} />
            </div>
          </div>

          {/* ── Details ── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: "Industry", value: industry },
              {
                label: "Experience",
                value: yearsOfExperience ? `${yearsOfExperience} Years` : "—",
              },
              { label: "Current Role", value: currentRole },
              { label: "Company", value: company },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>

          {/* ── Skills ── */}
          {skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Close button ── */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferredByProfileModal;
