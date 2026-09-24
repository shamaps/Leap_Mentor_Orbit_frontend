// src/components/mentee/dashboard/findMentors/MentorGrid.jsx
import MentorCard from "./MentorCard";
import EmptyState from "@/shared/components/EmptyState";
import type { MentorSummary } from "@/features/mentee/presenter/useMentorSearch";
// EmptyState is still a plain JS component (migrates in Phase 3.5); its inferred
// prop types mark every prop as required. Cast locally to avoid coupling
// this migration to that one.
 
const EmptyStateAny = EmptyState as any;
import MentorCardSkeleton from "@/shared/components/MentorCardSkeleton";
import { withProfiler } from "@/shared/utils/withProfiler";
import { useMountLogger } from "@/shared/hooks/useMountLogger";
import TabLoader from "@/shared/components/TabLoader";
const MORE_SKELETON_KEYS = ["more-1", "more-2", "more-3"];

interface MentorGridProps {
  mentors: MentorSummary[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  hasSearched: boolean;
  totalCount: number;
  onLoadMore: () => void;
  onViewProfile: (mentor: MentorSummary) => void;
}

const MentorGrid = ({
  mentors,
  loading,
  loadingMore,
  hasMore,
  hasSearched,
  totalCount,
  onLoadMore,
  onViewProfile,
}: MentorGridProps) => {
  useMountLogger("MentorGrid");

  if (loading) {
    return <TabLoader message="Finding mentors for you..." />;
  }
  if (hasSearched && mentors.length === 0) {
    return (
      <EmptyStateAny
        message="No mentors found"
        subMessage="Try adjusting your filters or searching a different skill."
      />
    );
  }
  return (
    <div className="space-y-6">
      {/* Results count */}
      <p className="text-xs text-slate-700 font-medium">
        Showing{" "}
        <span className="text-slate-600 font-bold">{mentors.length}</span> of{" "}
        <span className="text-slate-600 font-bold">{totalCount}</span> mentors
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mentors.map((mentor: MentorSummary) => (
          <MentorCard
            key={mentor?.id}
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

const ProfiledMentorGrid = withProfiler(MentorGrid, "MentorGrid");
export default ProfiledMentorGrid;