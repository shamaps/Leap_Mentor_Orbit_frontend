// src/pages/admin/AdminEngagements.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "@/components/atoms/StatCard";
import StatusBadge from "../../components/atoms/StatusBadge";

const FONT = "'DM Sans', sans-serif";
const MONO = "'DM Mono', monospace";

// ── Avatar ────────────────────────────────────────────────────
const Avatar = ({ name }) => {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors   = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color    = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-700 text-white"
      style={{ background: color, fontWeight: 700, fontFamily: FONT }}>
      {initials}
    </div>
  );
};

// ── User Cell ─────────────────────────────────────────────────
const UserCell = ({ user }) => (
  <div className="flex items-center gap-2.5">
    <Avatar name={user?.name} />
    <div>
      <p className="text-xs font-600 text-slate-800 leading-none" style={{ fontWeight: 600 }}>{user?.name || "—"}</p>
      <p className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily: MONO }}>{user?.email || "—"}</p>
    </div>
  </div>
);

// ── Slot Pill ─────────────────────────────────────────────────
const SlotPill = ({ slot }) => {
  const isCancelled = slot.status === "cancelled";
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: isCancelled ? "#fef2f2" : "#f8fafc",
        border: `1px solid ${isCancelled ? "#fecaca" : "#e2e8f0"}`,
      }}>
      {/* ✓ / ✗ icon */}
      {isCancelled ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      <span className="text-[10px] font-600"
        style={{ color: isCancelled ? "#ef4444" : "#475569", fontWeight: 500, fontFamily: MONO,
          textDecoration: isCancelled ? "line-through" : "none" }}>
        {slot.date} · {slot.startTime}–{slot.endTime}
      </span>
      {isCancelled && (
        <span className="text-[9px] font-600 ml-auto" style={{ color: "#ef4444", fontWeight: 600 }}>
          Cancelled
        </span>
      )}
    </div>
  );
};

// ── Expanded Detail Row ───────────────────────────────────────
const ExpandedDetail = ({ eng }) => (
  <tr>
    <td colSpan={6} style={{ background: "#f8fafc", borderBottom: "1px solid #e8eaf0" }}>
      <div className="px-6 py-4 grid grid-cols-2 gap-6">

        {/* Slots */}
        <div>
          <p className="text-[10px] font-700 uppercase tracking-widest text-slate-400 mb-2"
            style={{ fontWeight: 700, letterSpacing: "0.1em" }}>Proposed Slots</p>
          <div className="flex flex-col gap-1.5">
            {eng.selectedSlots?.map((s, i) => (
              <SlotPill key={i} slot={s} />
            ))}
          </div>
        </div>

        {/* Session details grid */}
        <div>
          <p className="text-[10px] font-700 uppercase tracking-widest text-slate-600 mb-2"
            style={{ fontWeight: 700, letterSpacing: "0.1em" }}>Session Details</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Rate / Session", value: eng.sessionRate ? `₹${eng.sessionRate}` : "—" },
              { label: "Session Count", value: eng.selectedSlots?.filter(s => s.status !== "cancelled").length ?? eng.sessionCount ?? "—" },
              { label: "Payment",       value: <StatusBadge status={eng.paymentStatus || "unpaid"} /> },
              { label: "Requested",     value: eng.requestedAt ? new Date(eng.requestedAt).toLocaleDateString("en-US",  { month: "short", day: "numeric", year: "numeric" }) : "—" },
              { label: "Responded",     value: eng.respondedAt ? new Date(eng.respondedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
              { label: "Completed At",  value: eng.completedAt ? new Date(eng.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-2 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}>
                <p className="text-[9px] font-700 uppercase tracking-widest text-slate-600 mb-0.5"
                  style={{ fontWeight: 700, letterSpacing: "0.08em" }}>{label}</p>
                <div className="text-xs font-600 text-slate-700" style={{ fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </td>
  </tr>
);

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm"
      style={{
        fontWeight: 600, fontFamily: FONT,
        background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
        border:     `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
        color:      toast.type === "success" ? "#15803d" : "#dc2626",
      }}>
      {toast.type === "success"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {toast.msg}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const AdminEngagements = () => {
  const [stats,        setStats]        = useState(null);
  const [engagements,  setEngagements]  = useState([]);
  const [pagination,   setPagination]   = useState({ total: 0, page: 1, totalPages: 1 });
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [loading,      setLoading]      = useState(true);
  const [expandedId,   setExpandedId]   = useState(null);
  const [toast,        setToast]        = useState(null);
  const searchTimer = useRef(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAxiosInstance.get("/admin/engagements/stats");
      setStats(res.data);
    } catch { showToast("Failed to load stats."); }
  }, []);

  // ── Fetch engagements ─────────────────────────────────────
  const fetchEngagements = useCallback(async (
    page   = 1,
    q      = search,
    status = statusFilter,
    from   = dateFrom,
    to     = dateTo,
  ) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (q)      params.search   = q;
      if (status) params.status   = status;
      if (from)   params.dateFrom = from;
      if (to)     params.dateTo   = to;
      const res = await adminAxiosInstance.get("/admin/engagements");
      setEngagements(res.data.engagements);
      setPagination(res.data.pagination);
    } catch {
      showToast("Failed to load engagements.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchStats(); fetchEngagements(); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchEngagements(1, val, statusFilter, dateFrom, dateTo), 400);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    fetchEngagements(1, search, s, dateFrom, dateTo);
  };

  const handleDateFilter = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    fetchEngagements(1, search, statusFilter, from, to);
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const STAT_CARDS = [
    { key: "total",     label: "Total",     accent: "#2563eb",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { key: "pending",   label: "Pending",   accent: "#d97706",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { key: "ongoing",   label: "Ongoing",   accent: "#7c3aed",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
    { key: "completed", label: "Completed", accent: "#059669",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { key: "rejected",  label: "Rejected",  accent: "#dc2626",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <AdminLayout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <Toast toast={toast} />

      <div className="space-y-6">

        {/* ── Header ───────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-700 text-slate-800" style={{ fontWeight: 700, fontFamily: FONT }}>Engagements</h1>
          <p className="text-sm text-slate-600 mt-0.5">Track all mentorship sessions across the platform.</p>
        </div>

        {/* ── Stat Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-4">
          {STAT_CARDS.map(({ key, label, accent, icon }) => (
            <StatCard key={key} label={label} value={stats?.[key]} accent={accent} icon={icon} />
          ))}
        </div>

        {/* ── Table Card ────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}>

          {/* Filters */}
          <div className="px-6 py-4 border-b space-y-3" style={{ borderColor: "#e8eaf0" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-700 text-slate-800" style={{ fontWeight: 700 }}>All Engagements</p>
                <p className="text-xs text-slate-600 mt-0.5">{pagination.total} total records</p>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={search} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search mentor or mentee..."
                  className="pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", width: 220, fontFamily: FONT, color: "#334155" }}
                  onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                  onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Status pills */}
              <div className="flex gap-1.5 flex-wrap">
                {["", "pending", "accepted", "ongoing", "completed", "rejected", "referred"].map((s) => (
                  <button key={s} onClick={() => handleStatusFilter(s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all capitalize"
                    style={{
                      fontWeight: 600, fontFamily: FONT,
                      background: statusFilter === s ? "#2563eb" : "#f1f5f9",
                      color:      statusFilter === s ? "white"   : "#475569",
                    }}>
                    {s === "" ? "All" : s}
                  </button>
                ))}
              </div>

              {/* Date range */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600" style={{ fontFamily: MONO }}>From</span>
                <input type="date" value={dateFrom}
                  onChange={(e) => handleDateFilter(e.target.value, dateTo)}
                  className="px-3 py-1.5 rounded-xl text-xs outline-none"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", fontFamily: MONO, color: "#94a3b8" }} />
                <span className="text-xs text-slate-600" style={{ fontFamily: MONO }}>To</span>
                <input type="date" value={dateTo}
                  onChange={(e) => handleDateFilter(dateFrom, e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs outline-none"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", fontFamily: MONO, color: "#94a3b8" }} />
                {(dateFrom || dateTo) && (
                  <button onClick={() => handleDateFilter("", "")}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-600"
                    style={{ background: "#fef2f2", color: "#dc2626", fontWeight: 600, border: "1px solid #fecaca" }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: FONT }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                  {["Mentor", "Mentee", "Status", "Payment", "Requested", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest"
                      style={{ color: "#334155", fontWeight: 800, letterSpacing: "0.12em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded-lg animate-pulse"
                            style={{ background: "#f1f5f9", width: j < 2 ? 130 : 70 }}/>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : engagements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-sm text-slate-400">
                      No engagements found.
                    </td>
                  </tr>
                ) : (
                  engagements.flatMap((eng) => {
                    const isExpanded = expandedId === eng._id;
                    const rows = [
                      <tr key={eng._id}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: isExpanded ? "none" : "1px solid #f1f5f9" }}
                        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "#fafbfc"; }}
                        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                        onClick={() => toggleExpand(eng._id)}>

                        <td className="px-5 py-4"><UserCell user={eng.mentor} /></td>
                        <td className="px-5 py-4"><UserCell user={eng.mentee} /></td>
                        <td className="px-5 py-4"><StatusBadge status={eng.status} /></td>
                        <td className="px-5 py-4"><StatusBadge status={eng.paymentStatus || "unpaid"} /></td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-800" style={{ fontFamily: MONO }}>
                            {eng.requestedAt
                              ? new Date(eng.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: isExpanded ? "#eff6ff" : "#f1f5f9" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke={isExpanded ? "#2563eb" : "#94a3b8"}
                              strokeWidth="2.5" strokeLinecap="round"
                              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </div>
                        </td>
                      </tr>
                    ];
                    if (isExpanded) rows.push(<ExpandedDetail key={`${eng._id}-detail`} eng={eng} />);
                    return rows;
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "#e8eaf0" }}>
              <p className="text-xs text-slate-400" style={{ fontFamily: MONO }}>
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
              </p>
              <div className="flex gap-2">
                <button onClick={() => fetchEngagements(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all disabled:opacity-30"
                  style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
                  ← Prev
                </button>
                <button onClick={() => fetchEngagements(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all disabled:opacity-30"
                  style={{ background: "#2563eb", color: "white", fontWeight: 600 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEngagements;