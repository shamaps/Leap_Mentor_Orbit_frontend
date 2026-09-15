// src/components/ui/connects/ConnectsLayout.tsx
import type { ReactNode } from "react";
import EmptyState from "@/shared/components/EmptyState";
import TabLoader from "@/shared/components/TabLoader";

// ── Skeleton card ─────────────────────────────────────────────
// (currently unused — TabLoader is used for loading states instead)

// ── Section divider ───────────────────────────────────────────
interface SectionDividerProps {
  label: string;
  count?: number;
}

const SectionDivider = ({ label, count }: SectionDividerProps) => (
  <div className="flex items-center gap-3 col-span-1 md:col-span-2 lg:col-span-3">
    <div className="flex-1 h-px bg-slate-100" />
    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap">
      {label} {!!count && count > 0 && `(${count})`}
    </span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

// ── Main Layout ───────────────────────────────────────────────
// EmptyState itself is still a plain JS component (migrates in Phase 3.5),
// so its inferred prop types don't mark optional props as optional. Kept
// loose here deliberately to avoid coupling this migration to that one.
type EmptyStateProps = Record<string, unknown>;

interface ConnectsLayoutProps {
  title: string;
  subtitle?: string;
  count?: number; // active count
  loading?: boolean;
  error?: string | null;
  emptyState?: EmptyStateProps;
  children?: ReactNode; // active ConnectCards
  completedChildren?: ReactNode; // completed ConnectCards
  completedCount?: number; // completed count
}

const ConnectsLayout = ({
  title,
  subtitle,
  count = 0, // active count
  loading,
  error,
  emptyState,
  children, // active ConnectCards
  completedChildren, // completed ConnectCards
  completedCount = 0, // completed count
}: ConnectsLayoutProps) => {
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
           
          <EmptyState {...(emptyState as any)} fullWidth />
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

export default ConnectsLayout;