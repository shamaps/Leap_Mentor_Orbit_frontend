// src/pages/admin/AdminPayments.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "@/components/atoms/StatCard";

const FONT = "'DM Sans', sans-serif";
const MONO = "'DM Mono', monospace";

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm"
      style={{
        fontWeight: 600, fontFamily: FONT,
        background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
        color: toast.type === "success" ? "#15803d" : "#dc2626",
      }}>
      {toast.msg}
    </div>
  );
};

// ── Avatar ─────────────────────────────────────────────────────
const Avatar = ({ name }) => {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-700 text-white"
      style={{ background: color, fontWeight: 700 }}>
      {initials}
    </div>
  );
};

// ── Type Badge ─────────────────────────────────────────────────
const TYPE_CONFIG = {
  credit: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0", label: "Commission" },
  escrow_hold: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Escrow" },
  escrow_release: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", label: "Released" },
  escrow_refund: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Refund" },
  commission_deduct: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0", label: "Commission" },
  mentor_payout: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", label: "Received" },
  debit: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Payout" },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: type };
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-700 uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 700, letterSpacing: "0.06em", fontFamily: FONT }}>
      {cfg.label}
    </span>
  );
};

// Status Badge
const STATUS_CONFIG = {
  completed: { color: "#059669", dot: "#22c55e", label: "COMPLETED" },
  pending: { color: "#d97706", dot: "#f59e0b", label: "PENDING" },
  refunded: { color: "#dc2626", dot: "#ef4444", label: "REFUNDED" },
};

const TxStatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: "#64748b", dot: "#94a3b8", label: status?.toUpperCase() };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] uppercase"
      style={{ color: cfg.color, fontWeight: 600, letterSpacing: "0.05em", fontFamily: FONT }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

// ── Revenue Chart ──────────────────────────────────────────────
const RevenueChart = ({ data = [], loading }) => {
  const [hovered, setHovered] = useState(null);

  const PAD_LEFT = 45;
  const W = 700, H = 180;
  const CHART_W = W - PAD_LEFT;

  if (loading) return <div className="h-44 rounded-2xl animate-pulse" style={{ background: "#f1f5f9" }} />;
  if (!data.length) return null;

  const values = data.map((d) => d.amount);
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const range = max - min || 1;

  const xs = data.map((_, i) => PAD_LEFT + (i / (data.length - 1)) * CHART_W);
  const ys = values.map((v) => H - ((v - min) / range) * (H * 0.72) - H * 0.1);

  let line = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < data.length - 1; i++) {
    const cpx1 = xs[i] + (xs[i + 1] - xs[i]) / 3;
    const cpx2 = xs[i + 1] - (xs[i + 1] - xs[i]) / 3;
    line += ` C ${cpx1} ${ys[i]}, ${cpx2} ${ys[i + 1]}, ${xs[i + 1]} ${ys[i + 1]}`;
  }
  const area = `${line} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;

  const fmtVal = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
  const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 200 }}
        onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Y_TICKS.filter((t) => t > 0 && t < 1).map((t, i) => (
          <line key={i} x1={PAD_LEFT} y1={H * t} x2={W} y2={H * t}
            stroke="#e8eaf0" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        {/* Y-axis labels */}
        {Y_TICKS.map((t, i) => {
          const value = Math.round(min + (max - min) * (1 - t));
          const y = Math.max(8, Math.min(H - 4, H * t));
          return (
            <text key={i} x={PAD_LEFT - 6} y={y} fill="#94a3b8" fontSize="9"
              fontFamily={MONO} textAnchor="end" dominantBaseline="middle">
              {fmtVal(value)}
            </text>
          );
        })}

        {/* Y-axis line */}
        <line x1={PAD_LEFT} y1={0} x2={PAD_LEFT} y2={H} stroke="#e8eaf0" strokeWidth="1" />

        {/* Area + Line */}
        <path d={area} fill="url(#revGrad)" />
        <path d={line} fill="none" stroke="#2563eb" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover */}
        {xs.map((x, i) => (
          <g key={i}>
            <rect x={x - 14} y={0} width={28} height={H} fill="transparent"
              onMouseEnter={() => setHovered(i)} />
            {hovered === i && (
              <>
                <line x1={x} y1={0} x2={x} y2={H} stroke="#2563eb" strokeWidth="1"
                  strokeDasharray="3 3" opacity="0.4" />
                <circle cx={x} cy={ys[i]} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
                <g transform={`translate(${Math.min(x - 35, W - 90)}, ${Math.max(ys[i] - 42, 4)})`}>
                  <rect x="0" y="0" width="84" height="32" rx="6" fill="#1e293b" />
                  <text x="9" y="13" fill="#94a3b8" fontSize="9" fontFamily={MONO}>{data[i]?.label}</text>
                  <text x="9" y="26" fill="#60a5fa" fontSize="11" fontFamily={MONO} fontWeight="600">
                    {values[i].toLocaleString()} LP
                  </text>
                </g>
              </>
            )}
          </g>
        ))}

        {/* X-axis labels */}
        {xs.map((x, i) => (
          <text key={i} x={x} y={H + 14} fill="#94a3b8" fontSize="9"
            fontFamily={MONO} textAnchor="middle">
            {data[i]?.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const AdminPayments = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ totalCount: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [toast, setToast] = useState(null);
  const searchTimer = useRef(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAxiosInstance.get("/admin/payments/stats", );
      setStats(res.data);
    } catch { showToast("Failed to load payment stats."); }
  }, []);

  const fetchChart = useCallback(async () => {
    try {
      setLoadingChart(true);
      const res = await adminAxiosInstance.get("/admin/payments/chart");
      setChartData(res.data.data || []);
    } catch { showToast("Failed to load chart."); }
    finally { setLoadingChart(false); }
  }, []);

  const fetchTransactions = useCallback(async (page = 1, q = search, type = typeFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (q) params.search = q;
      if (type) params.type = type;
      const res = await adminAxiosInstance.get("/admin/payments/transactions", {
      });
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination);
    } catch { showToast("Failed to load transactions."); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchStats();
    fetchChart();
    fetchTransactions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchTransactions(1, val, typeFilter), 400);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    fetchTransactions(1, search, type);
  };

  // No trend values
  const STAT_CARDS = [
    {
      label: "Total Revenue",
      value: stats?.totalRevenue,
      accent: "#2563eb",
      icon: <span style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: "currentColor", letterSpacing: "-0.02em" }}>
      LP
    </span>,
    },
    {
      label: "Platform Commission",
      value: stats?.platformCommission,
      sub: stats?.commissionRate != null ? `${stats.commissionRate}% rate` : "—",
      accent: "#059669",
      icon: <span style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: "currentColor", letterSpacing: "-0.02em" }}>
      LP
    </span>,
    },
    {
      label: "Pending Payouts",
      value: stats?.pendingPayouts,
      sub: "Held in escrow",
      accent: "#d97706",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    {
      label: "Refunded Requests",
      value: stats?.refundedRequests,
      sub: "Requires Action",
      accent: "#dc2626",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    },
  ];

  const TYPE_FILTERS = [
  { key: "",                 label: "All" },
  { key: "commission_deduct",label: "Commission" },
  { key: "mentor_payout",    label: "Received" },
  { key: "debit",            label: "Payout" },
  { key: "escrow_hold",      label: "Escrow Hold" },
  { key: "escrow_refund",    label: "Refund" },
];

  return (
    <AdminLayout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <Toast toast={toast} />

      <div className="space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-700 text-slate-800" style={{ fontWeight: 700, fontFamily: FONT }}>
            Payment Tracking
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitor platform revenue and financial transactions across all departments.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {STAT_CARDS.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* ── Revenue Chart ── */}
        <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-700 text-slate-800" style={{ fontWeight: 700, fontFamily: FONT }}>
                Revenue Overview
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Growth trajectory </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-xs text-slate-500" style={{ fontFamily: MONO }}>Net Revenue</span>
              <span className="text-xs font-600 px-2.5 py-1 rounded-lg ml-1"
                style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
                Last 6 Months
              </span>
            </div>
          </div>
          <RevenueChart data={chartData} loading={loadingChart} />
        </div>

        {/* ── Transaction Table ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}>

          <div className="px-6 py-4 border-b space-y-3" style={{ borderColor: "#e8eaf0" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-700 text-slate-800" style={{ fontWeight: 700, fontFamily: FONT }}>
                  Transaction History
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {pagination.totalCount} total transactions
                </p>
              </div>

              {/* ✅ Only search — no Export CSV, no Filters */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13"
                  viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search user..."
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-all"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", width: 200, fontFamily: FONT, color: "#334155" }}
                  onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            {/* Type filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {TYPE_FILTERS.map(({ key, label }) => (
                <button key={key} onClick={() => handleTypeFilter(key)}
                  className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all"
                  style={{
                    fontWeight: 600, fontFamily: FONT,
                    background: typeFilter === key ? "#2563eb" : "#f1f5f9",
                    color: typeFilter === key ? "white" : "#475569",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: FONT }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                  {["TRANSACTION ID", "USER", "AMOUNT", "TYPE", "DATE", "STATUS"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest"
                      style={{ color: "#334155", fontWeight: 800, letterSpacing: "0.12em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded-lg animate-pulse"
                            style={{ background: "#f1f5f9", width: j === 0 ? 100 : j === 1 ? 130 : 70 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-sm text-slate-400">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fafbfc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td className="px-5 py-4">
                        <span className="text-xs font-100 text-slate-800"
                          style={{ fontFamily: MONO, fontWeight: 500 }}>{tx.txId}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={tx.user?.name} />
                          <div>
                            <p className="text-xs font-600 text-slate-900 leading-none"
                              style={{ fontWeight: 600 }}>{tx.user?.name}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5"
                              style={{ fontFamily: MONO }}>{tx.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-500 text-slate-800"
                          style={{ fontFamily: MONO, fontWeight: 500 }}>
                          {tx.amount?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-4"><TypeBadge type={tx.type} /></td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-800" style={{ fontFamily: MONO }}>{tx.date}</span>
                      </td>
                      <td className="px-5 py-4"><TxStatusBadge status={tx.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "#e8eaf0" }}>
            <p className="text-xs text-slate-600" style={{ fontFamily: MONO }}>
              Showing {transactions.length} of {pagination.totalCount} transactions
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => fetchTransactions(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-600 transition-all disabled:opacity-30"
                style={{ background: "#f1f5f9", color: "#475569" }}>‹</button>
              {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => fetchTransactions(p)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-600 transition-all"
                    style={{
                      fontWeight: 600,
                      background: pagination.currentPage === p ? "#2563eb" : "#f1f5f9",
                      color: pagination.currentPage === p ? "white" : "#475569",
                    }}>{p}</button>
                );
              })}
              <button onClick={() => fetchTransactions(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-600 transition-all disabled:opacity-30"
                style={{ background: "#f1f5f9", color: "#475569" }}>›</button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminPayments;