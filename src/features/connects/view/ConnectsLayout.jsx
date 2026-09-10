// src/components/ui/connects/ConnectsLayout.jsx
import EmptyState from "@/shared/components/EmptyState";
import PropTypes from "prop-types";
import TabLoader from "@/shared/components/TabLoader";
// ── Skeleton card ─────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
        <div className="flex gap-1 mt-1">
          <div className="h-4 w-12 bg-slate-100 rounded-full" />
          <div className="h-4 w-14 bg-slate-100 rounded-full" />
          <div className="h-4 w-10 bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
    <div className="border-t border-slate-100" />
    <div className="space-y-2">
      <div className="h-2.5 bg-slate-100 rounded w-3/4" />
      <div className="h-2.5 bg-slate-100 rounded w-1/2" />
      <div className="h-2.5 bg-slate-100 rounded w-2/5" />
    </div>
    <div className="h-9 bg-slate-200 rounded-xl" />
  </div>
);

// ── Section divider ───────────────────────────────────────────
const SectionDivider = ({ label, count }) => (
  <div className="flex items-center gap-3 col-span-1 md:col-span-2 lg:col-span-3">
    <div className="flex-1 h-px bg-slate-100" />
    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap">
      {label} {count > 0 && `(${count})`}
    </span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);
SectionDivider.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number,
};
// ── Main Layout ───────────────────────────────────────────────
const ConnectsLayout = ({
  title,
  subtitle,
  count, // active count
  loading,
  error,
  emptyState,
  children, // active ConnectCards
  completedChildren, // completed ConnectCards
  completedCount, // completed count
}) => {
  const hasCompleted = completedCount > 0;
  if (loading) {
    return <TabLoader message="Loading your connects..." />;
  }
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {subtitle && (
            <p className="text-sm text-blue-900 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Active count badge */}
        {!loading && count > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-blue-50 border border-blue-100 text-blue-900 text-xs font-bold shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {count} Active {count === 1 ? "Session" : "Sessions"}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="flex items-center gap-2 text-sm bg-red-50 border border-red-200
          text-red-600 rounded-xl px-4 py-3"
        >
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── Active grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Empty state — only show if no active AND no completed */}
        {!loading && !error && count === 0 && !hasCompleted && (
          <EmptyState {...emptyState} fullWidth />
        )}

        {/* Active cards */}
        {!loading && !error && children}

        {/* ── Completed section ── */}
        {!loading && !error && hasCompleted && (
          <>
            <SectionDivider label="Completed Sessions" count={completedCount} />
            {completedChildren}
          </>
        )}
      </div>
    </div>
  );
};
ConnectsLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  count: PropTypes.number,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyState: PropTypes.object,
  children: PropTypes.node,
  completedChildren: PropTypes.node,
  completedCount: PropTypes.number,
};
export default ConnectsLayout;
