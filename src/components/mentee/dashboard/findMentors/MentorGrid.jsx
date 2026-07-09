// src/components/mentee/dashboard/findMentors/MentorGrid.jsx
import MentorCard from "./MentorCard";
import MentorCardSkeleton from "@/components/common/MentorCardSkeleton";
import EmptyState from "../../../common/EmptyState";
import PropTypes from "prop-types";
import { withProfiler } from "../../../../utils/withProfiler";
import { useMountLogger } from "../../../../hooks/useMountLogger";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];
const MORE_SKELETON_KEYS = ["more-1", "more-2", "more-3"];

const MentorGrid = ({
  mentors,
  loading,
  loadingMore,
  hasMore,
  hasSearched,
  totalCount,
  onLoadMore,
  onViewProfile,
}) => {
  useMountLogger("MentorGrid");

  // ── Loading skeletons — initial search ───────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SKELETON_KEYS.map((key) => (
          <MentorCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  // ... (rest unchanged, everything from "Empty state" down to "Show More" block stays the same)

  return (
    <div className="space-y-6">
      {/* Results count */}
      <p className="text-xs text-slate-700 font-medium">
        Showing{" "}
        <span className="text-slate-600 font-bold">{mentors.length}</span> of{" "}
        <span className="text-slate-600 font-bold">{totalCount}</span> mentors
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            onViewProfile={onViewProfile}
          />
        ))}

        {loadingMore &&
          MORE_SKELETON_KEYS.map((key) => (
            <MentorCardSkeleton key={key} />
          ))}
      </div>

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

MentorGrid.propTypes = {
  mentors: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  loadingMore: PropTypes.bool,
  hasMore: PropTypes.bool,
  hasSearched: PropTypes.bool,
  totalCount: PropTypes.number,
  onLoadMore: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
};

export default withProfiler(MentorGrid, "MentorGrid");