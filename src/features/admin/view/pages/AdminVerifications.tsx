// src/features/admin/view/pages/AdminVerifications.tsx
import { useAdminVerifications } from "../../presenter/useAdminVerifications";
import { useRevalidator } from "react-router-dom";
import ErrorState from "@/shared/components/ErrorState";
import DetailDrawer from "../components/verifications/DetailDrawer";
import VerificationStatusBadge from "../components/verifications/VerificationStatusBadge";
import {
  IconCheck,
  IconDoc,
  IconEye,
  IconFilter,
  IconSearch,
  IconShield,
  IconX,
} from "../components/verifications/VerificationIcons";
// ErrorState is still a plain JS component (migrates in Phase 3.5); its inferred
// prop types mark every prop as required. Cast locally to avoid coupling
// this migration to that one.


// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
const AdminVerifications = () => {
  const {
    mentors,
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    selected,
    setSelected,
    verifying,
    toast,
    handleVerify,
    filtered,
    counts,
  } = useAdminVerifications();

  const revalidator = useRevalidator();

  let mentorRowsContent;
  if (loading) {
    mentorRowsContent = (
      <div className="px-5 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading mentors…</p>
      </div>
    );
  } else if (error) {
    mentorRowsContent = <ErrorState message={error} onAction={() => revalidator.revalidate()} compact />;
  } else if (filtered.length === 0) {
    mentorRowsContent = (
      <div className="px-5 py-16 text-center">
        <p className="text-sm text-slate-400">No mentors found.</p>
      </div>
    );
  } else {
    mentorRowsContent = filtered.map((m, i) => {
      const isVerified = m.verificationStatus === "verified";
      const docCount =
        (m.resumeDocument?.url ? 1 : 0) +
        (m.workExperienceDocuments?.length || 0);

      return (
        <div
          key={m._id || m.user?._id || i}
          role="button"
          tabIndex={0}
          className="grid items-center px-5 py-4 transition-all duration-150 hover:bg-blue-50/40 cursor-pointer"
          style={{
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1.2fr 80px",
            borderBottom:
              i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
          }}
          onClick={() => setSelected(m)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelected(m);
            }
          }}
        >
          {/* Name + avatar */}
          <div className="flex items-center gap-3 min-w-0">
            {m.profilePicture ? (
              <img
                src={m.profilePicture}
                alt={m.user?.name}
                className="w-8 h-8 rounded-xl object-cover flex-shrink-0 border border-slate-100"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#1e40af,#3b82f6)",
                }}
              >
                {m.user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <p className="text-sm font-semibold text-slate-800 truncate">
              {m.user?.name || "—"}
            </p>
          </div>

          {/* Email */}
          <p className="text-xs text-slate-500 truncate">
            {m.user?.email || "—"}
          </p>

          {/* Doc count */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">
              <IconDoc />
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {docCount}
            </span>
            {docCount === 0 && (
              <span className="text-[10px] text-slate-400">none</span>
            )}
          </div>

          {/* Phone */}
          <p className="text-xs text-slate-600">
            {m.phoneNumber || <span className="text-slate-300">—</span>}
          </p>

          {/* Status badge */}
          <VerificationStatusBadge status={m.verificationStatus || "pending"} />

          {/* View button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(m);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
              style={
                isVerified
                  ? { background: "#f1f5f9", color: "#64748b" }
                  : { background: "#eff6ff", color: "#1d4ed8" }
              }
            >
              <IconEye /> View
            </button>
          </div>
        </div>
      );
    });
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all"
          style={
            toast.type === "success"
              ? { background: "#15803d", color: "#fff" }
              : { background: "#dc2626", color: "#fff" }
          }
        >
          {toast.type === "success" ? <IconCheck /> : <IconX />}
          {toast.message}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <DetailDrawer
          mentor={selected}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
          verifying={verifying}
        />
      )}

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)" }}
          >
            <span className="text-white">
              <IconShield />
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Mentor Verifications
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review submitted documents and approve mentors
            </p>
          </div>
        </div>
        <button
          onClick={() => revalidator.revalidate()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-50 transition-all"
        >
          Refresh
        </button>
      </div>

      {/* ── Stat pills ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(
          [
            {
              key: "all" as const,
              label: "Total Mentors",
              color: "#1e40af",
              bg: "#eff6ff",
            },
            {
              key: "pending" as const,
              label: "Pending Review",
              color: "#a16207",
              bg: "#fefce8",
            },
            {
              key: "verified" as const,
              label: "Verified",
              color: "#15803d",
              bg: "#f0fdf4",
            },
          ]
        ).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className="flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-150"
            style={{
              background: filter === s.key ? s.bg : "#ffffff",
              borderColor: filter === s.key ? s.color : "#e8eaf0",
              boxShadow: filter === s.key ? `0 0 0 1px ${s.color}22` : "none",
            }}
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {counts[s.key]}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── Search + filter bar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: "#e2e8f0",
              background: "#ffffff",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            <IconFilter />
          </span>
          {["all", "pending", "verified"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={
                filter === f
                  ? { background: "#1e40af", color: "#fff" }
                  : { background: "#f1f5f9", color: "#475569" }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: "#e8eaf0" }}
      >
        {/* Table head */}
        <div
          className="grid items-center px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400"
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #e8eaf0",
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1.2fr 80px",
          }}
        >
          <span>Mentor</span>
          <span>Email</span>
          <span>Docs</span>
          <span>Phone</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {/* Rows */}
        {mentorRowsContent}
      </div>

      {/* Count footer */}
      {!loading && !error && (
        <p className="text-xs text-slate-400 mt-3 text-right">
          Showing {filtered.length} of {mentors.length} mentors
        </p>
      )}
    </div>
  );
};

export default AdminVerifications;