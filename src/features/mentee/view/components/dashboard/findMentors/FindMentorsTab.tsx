// src/components/mentee/dashboard/findMentors/FindMentorsTab.jsx
import { useState, useEffect } from "react";
import useMentorSearch from "@/features/mentee/presenter/useMentorSearch";
import SearchBar from "./SearchBar";
import FilterPanel from "./FilterPanel";
import MentorGrid from "./MentorGrid";
import MentorProfileModal from "./MentorProfileModal";
import { getPlatformCommissionRate } from "@/features/shared-dashboard/model/escrow.api";
import ErrorState from "@/shared/components/ErrorState";
import type { MentorSummary } from "@/features/mentee/presenter/useMentorSearch";
// ErrorState is still a plain JS component (migrates in Phase 3.5); its inferred
// prop types mark every prop as required. Cast locally to avoid coupling
// this migration to that one.
 
const ErrorStateAny = ErrorState as any;
const FindMentorsTab = () => {
  const {
    skill,
    filters,
    mentors,
    loading,
    loadingMore,
    error,
    hasSearched,
    hasMore,
    totalCount,
    setSkill,
    updateFilter,
    resetFilters,
    loadMore,
  } = useMentorSearch();

  const [selectedMentor, setSelectedMentor] = useState<MentorSummary | null>(null);
  const [commissionRate, setCommissionRate] = useState(null);
  const [feeLoading, setFeeLoading] = useState(true);

  useEffect(() => {
    const fetchCommissionRate = async () => {
      try {
        const data = await getPlatformCommissionRate();
        setCommissionRate(data.commissionRate);
      } catch {
        setCommissionRate(null);
      } finally {
        setFeeLoading(false);
      }
    };
    fetchCommissionRate();
  }, []);
  let commissionRateContent = null;
  if (feeLoading) {
    commissionRateContent = (
      <div className="h-7 w-16 bg-slate-200 rounded-lg animate-pulse" />
    );
  } else if (commissionRate != null) {
    commissionRateContent = (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-slate-800 leading-none">
          {commissionRate}
        </span>
        <span className="text-sm font-bold text-amber-500">%</span>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {/* ── Header + Fee Card row ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Find Mentors</h1>
          <p className="text-sm text-blue-900 mt-0.5">
            Search by skill or name to find the right mentor for your goals.
          </p>
        </div>

        {/* Platform Fee Card — top right */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-3 flex flex-col gap-1.5 w-44 shrink-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-800">Platform Fee</p>
          </div>

          <p className="text-[10px] text-blue-900 font-medium">Current Rate</p>

          {commissionRateContent}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <SearchBar
          skill={skill}
          setSkill={setSkill}
        />
        <FilterPanel
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
        />
      </div>

      {/* Error */}
      {error && <ErrorStateAny message={error} fullWidth compact />}

      {/* Results */}
      <MentorGrid
        mentors={mentors}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        hasSearched={hasSearched}
        totalCount={totalCount}
        onLoadMore={loadMore}
        onViewProfile={setSelectedMentor}
      />

      {selectedMentor && (
        <MentorProfileModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  );
};

export default FindMentorsTab;