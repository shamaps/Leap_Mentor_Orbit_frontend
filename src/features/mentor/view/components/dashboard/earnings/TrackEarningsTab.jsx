// src/components/mentor/dashboard/earnings/TrackEarningsTab.jsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ErrorState from "@/shared/components/ErrorState";
import StatusBadge from "@/shared/components/StatusBadge";
import useTrackEarnings from "@/features/mentor/presenter/useTrackEarnings";
import StatCard from "@/shared/components/StatCard";
import EmptyState from "@/shared/components/EmptyState";
import PropTypes from "prop-types";
// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-blue-900">
          {fmt(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};
// ── Loading Skeleton ──────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`bg-slate-100 animate-pulse rounded-xl ${className}`} />
);
Skeleton.propTypes = {
  className: PropTypes.string,
};
// ── Main Component ────────────────────────────────────────────
const TrackEarningsTab = () => {
  const {
    stats,
    loadingStats,
    chartData,
    chartPeriod,
    loadingChart,
    payouts,
    loadingPayouts,
    search,
    setSearch,
    page,
    hasMore,
    totalCount,
    error,
    handleChartPeriod,
    goNext,
    goPrev,
  } = useTrackEarnings();
  let tableBody;
  if (loadingPayouts) {
    tableBody = [1, 2, 3, 4].map((i) => (
      <tr key={i}>
        {[1, 2, 3, 4, 5, 6].map((j) => (
          <td key={j} className="py-3 pr-4">
            <Skeleton className="h-4 w-full" />
          </td>
        ))}
      </tr>
    ));
  } else if (payouts.length === 0) {
    tableBody = (
      <tr>
        <td colSpan={6}>
          <EmptyState
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
            message="No payouts found"
            subMessage={search ? `No results for "${search}"` : "Completed sessions will appear here."}
            compact
          />
        </td>
      </tr>
    );
  } else {
    tableBody = payouts.map((row) => (
      <tr
        key={row.id}
        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
      >
        <td className="py-3.5 pr-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
          {row.date}
        </td>
        <td className="py-3.5 pr-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
          {row.menteeName}
        </td>
        <td className="py-3.5 pr-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {row.sessionType}
        </td>
        <td className="py-3.5 pr-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
          {row.duration}
        </td>
        <td className="py-3.5 pr-4 text-sm font-semibold text-slate-600">
          {fmt(row.amount)}
        </td>
        <td className="py-3.5">
          <StatusBadge status={row.status === "paid" ? "completed" : row.status} variant="history" />
        </td>
      </tr>
    ));
  }
  return (
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Track Earnings
            </h1>
            <p className="text-sm text-blue-900 mt-0.5">
              Monitor your mentorship income and session performance.
            </p>
          </div>
        </div>

        {/* ── Error ── */}
        {error && <ErrorState message={error} onAction={fetchStats} compact />}

        {/* ── Stat Cards — 2 cols mobile, 4 cols large ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStats ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                variant="earnings"
                label="Total Earnings"
                value={fmt(stats.totalEarnings)}
                sub={
                  <span className="flex items-center gap-0.5">
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
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </span>
                }
              />
              <StatCard
                variant="earnings"
                label="Sessions This Month"
                value={stats.sessionsThisMonth}
                sub={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
                subColor="text-slate-400"
              />
              <StatCard
                variant="earnings"
                label="Average Rating"
                value={`${Number(stats.avgRating || 0).toFixed(1)}/5.0`}
                sub={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="#F59E0B"
                    stroke="#F59E0B"
                    strokeWidth="1"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                }
                subColor="text-amber-400"
              />
              <StatCard
                variant="earnings"
                label="Pending Payout"
                value={fmt(stats.pendingPayout)}
                sub={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
                subColor="text-slate-400"
              />
            </>
          )}
        </div>

        {/* ── Earnings Chart ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Earnings</h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 self-start sm:self-auto shrink-0">
              {["monthly", "weekly"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleChartPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    chartPeriod === p
                      ? "bg-white text-blue-900 shadow-sm"
                      : "text-slate-700 hover:text-slate-600"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loadingChart ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={246}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="earningsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3B82F6"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#1E293B", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#1E293B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fill="url(#earningsGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#3B82F6", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Payout History ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-base font-bold text-slate-800">
              Payout History
            </h2>
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mentee..."
                className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all w-full sm:w-52"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "DATE",
                    "MENTEE NAME",
                    "SESSION TYPE",
                    "DURATION",
                    "AMOUNT",
                    "STATUS",
                  ].map((h) => (
                    <th
                      key={h}
                      className="pb-3 text-left text-[10px] font-bold text-slate-800 uppercase tracking-wider pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
              {tableBody}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-500">
              Showing {payouts.length} of {totalCount} records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!hasMore}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

  );
};

export default TrackEarningsTab;
