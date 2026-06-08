// src/components/mentee/dashboard/findMentors/MentorGrid.jsx
import MentorCard from "./MentorCard";
import MentorCardSkeleton from "@/components/atoms/MentorCardSkeleton";

// ✅ Added onViewProfile prop — passed down to each MentorCard
const MentorGrid = ({ mentors, loading, loadingMore, hasMore, hasSearched, totalCount, onLoadMore, onViewProfile }) => {

  // ── Loading skeletons — initial search ───────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <MentorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Empty state — search done but no results ─────────────
  if (hasSearched && mentors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-700">No mentors found</p>
        <p className="text-xs text-slate-400 mt-1">Try a different skill or adjust your filters</p>
      </div>
    );
  }

  // ── Pre-search state — nothing typed yet ─────────────────
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-700">Find your perfect mentor</p>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          Type a skill above — like <span className="font-semibold text-slate-500">React</span>, <span className="font-semibold text-slate-500">Python</span>, or <span className="font-semibold text-slate-500">Design</span> — to discover mentors who can help you grow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <p className="text-xs text-slate-700 font-medium">
        Showing <span className="text-slate-600 font-bold">{mentors.length}</span> of{" "}
        <span className="text-slate-600 font-bold">{totalCount}</span> mentors
      </p>

      {/* ── Cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor._id}
            mentor={mentor}
            onViewProfile={onViewProfile} // ✅ passed down
          />
        ))}

        {/* Append skeletons while loading more */}
        {loadingMore &&
          Array.from({ length: 3 }).map((_, i) => (
            <MentorCardSkeleton key={`more-${i}`} />
          ))}
      </div>

      {/* Show More — only if hasMore AND not loading */}
      {hasMore && !loadingMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-blue-200 text-blue-900 text-xs font-bold hover:bg-blue-50 hover:border-blue-400 transition-all duration-150"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Show More
          </button>
        </div>
      )}
    </div>
  );
};

export default MentorGrid;