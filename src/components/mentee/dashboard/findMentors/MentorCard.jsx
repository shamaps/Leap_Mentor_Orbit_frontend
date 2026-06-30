// src/components/mentee/dashboard/findMentors/MentorCard.jsx

const MAX_SKILLS_SHOWN = 3;

const StarRating = ({ rating }) => {
  const normalizedRating = Number(rating) || 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={star <= Math.round(normalizedRating) ? "#FBBF24" : "none"}
          stroke={star <= Math.round(normalizedRating) ? "#FBBF24" : "#CBD5E1"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-slate-500 ml-0.5 font-medium">
        {normalizedRating > 0 ? normalizedRating.toFixed(1) : "New"}
      </span>
    </div>
  );
};

// ── Verification Badge ──
const VerificationBadge = ({ status }) => {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      Unverified
    </span>
  );
};

const MentorCard = ({ mentor, onViewProfile }) => {
  const { user, currentRole, company, industry, skills = [], hourlyRate, avgRating, profilePicture, verificationStatus, yearsOfExperience } = mentor;

  const visibleSkills = skills.slice(0, MAX_SKILLS_SHOWN);
  const extraSkills   = skills.length - MAX_SKILLS_SHOWN;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 p-5 flex flex-col gap-3">

      {/* ── Top row: avatar + name + industry badge + verification badge ── */}
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {profilePicture ? (
            <img src={mentor.profilePicture56 || profilePicture} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center text-white text-base font-bold border-2 border-blue-100">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "—"}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {currentRole || "—"}
            {company ? ` · ${company}` : ""}
          </p>
          {/* ── Years of Experience ── */}
          {yearsOfExperience != null && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
              {yearsOfExperience} {yearsOfExperience === 1 ? "yr" : "yrs"} experience
            </p>
          )}
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            {industry && (
              <span className="inline-block text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {industry}
              </span>
            )}
            <VerificationBadge status={verificationStatus} />
          </div>
        </div>
      </div>

      {/* ── Skills ── */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((skill, i) => (
            <span key={i} className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
              +{extraSkills} more
            </span>
          )}
        </div>
      )}

      {/* ── Price + rating ── */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-slate-800">
            {hourlyRate ? (
              <p className="font-black text-slate-600 leading-none flex items-end gap-1">
                <span className="text-xl">{hourlyRate}</span>
                <span className="text-sm font-bold text-amber-500 mb-0.5">LP</span>
                <span className="text-sm font-medium text-slate-400 mb-1">/hr</span>
              </p>
            ) : (
              <p className="text-3xl font-black text-slate-500">Free</p>
            )}
          </span>
        </div>
        <StarRating rating={avgRating} />
      </div>

      {/* ── View Profile button ── */}
      <button
        type="button"
        onClick={() => onViewProfile(mentor)}
        className="w-full mt-1 py-2.5 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 active:scale-95 transition-all duration-150 shadow-sm shadow-blue-100"
      >
        View Profile
      </button>
    </div>
  );
};

export default MentorCard;