// src/pages/admin/AdminUserManagement.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import adminAxiosInstance from "../../utils/axiosInstance";
import StatCard from "@/components/common/StatCard";
import UserGrowthChart from "../../components/admin/common/UserGrowthChart";
import MentorIndustryChart from "../../components/admin/common/MentorIndustryChart";
import logger from "../../utils/logger";
import PropTypes from "prop-types";
const SKELETON_ROW_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"];
const SKELETON_COL_KEYS = ["col-1", "col-2", "col-3", "col-4", "col-5"];
// ── Unified Action Modal (Handles Delete, Block, Unblock) ─────
const ConfirmActionModal = ({ user, mode, onConfirm, onCancel, loading }) => {
  const config = {
    delete: {
      color: "#ef4444",
      bg: "#fef2f2",
      border: "#fecaca",
      title: "Delete User Account",
      desc: `You're about to permanently delete ${user?.name}. This will remove their profile and all associated sessions. This cannot be undone.`,
      btnText: "Yes, Delete",
      loadingText: "Deleting...",
      icon: (
        <>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4h6v2" />
        </>
      ),
    },
    block: {
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
      title: "Block User Account",
      desc: `You're about to block ${user?.name}. They will immediately be prevented from logging into the platform. Their data will remain intact.`,
      btnText: "Yes, Block",
      loadingText: "Blocking...",
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </>
      ),
    },
    unblock: {
      color: "#15803d",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      title: "Restore User Account",
      desc: `You're about to unblock ${user?.name}. They will regain full access to log into their account immediately.`,
      btnText: "Yes, Unblock",
      loadingText: "Unblocking...",
      icon: (
        <>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </>
      ),
    },
  };

  const current = config[mode];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: current.bg,
              border: `1px solid ${current.border}`,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={current.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {current.icon}
            </svg>
          </div>
          <div>
            <p
              className="text-sm font-700 text-slate-800"
              style={{ fontWeight: 700 }}
            >
              {current.title}
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {current.desc}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border text-xs font-600 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
            style={{ border: "1px solid #e2e8f0", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-xs font-600 text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: current.color, fontWeight: 600 }}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {current.loadingText}
              </>
            ) : (
              current.btnText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
ConfirmActionModal.propTypes = {
  user: PropTypes.shape({ name: PropTypes.string }),
  mode: PropTypes.oneOf(["delete", "block", "unblock"]).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
// ── Role Badge ────────────────────────────────────────────────
const RoleBadge = ({ roles }) => {
  const isMentor = roles?.includes("mentor");
  return (
    <span
      className="px-2.5 py-1 rounded-lg text-[10px] font-700 uppercase tracking-wide"
      style={{
        fontWeight: 700,
        background: isMentor ? "#eff6ff" : "#f0fdf4",
        color: isMentor ? "#1d4ed8" : "#15803d",
        letterSpacing: "0.06em",
      }}
    >
      {isMentor ? "Mentor" : "Mentee"}
    </span>
  );
};
RoleBadge.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string),
};
// ── Avatar ────────────────────────────────────────────────────
const Avatar = ({ name, picture }) => {
  if (picture)
    return (
      <img
        src={picture}
        alt={name}
        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
      />
    );
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[initials.codePointAt(0) % colors.length];
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-700 text-white"
      style={{ background: color, fontWeight: 700 }}
    >
      {initials}
    </div>
  );
};
Avatar.propTypes = {
  name: PropTypes.string,
  picture: PropTypes.string,
};
// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const AdminUserManagement = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showBlocked, setShowBlocked] = useState(false); // ← NEW STATE FOR TOGGLE
  const [loading, setLoading] = useState(true);

  const [actionModal, setActionModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [industryData, setIndustryData] = useState([]);

  const searchTimer = useRef(null);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = ({ message, type = "success" }) => {
    setToast({ msg: message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetchers ──────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAxiosInstance.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      logger.error("Error fetching stats", { err });
    }
  }, []);

  const fetchGrowthData = useCallback(async () => {
    try {
      const res = await adminAxiosInstance.get("/admin/user-growth");
      setGrowthData(res.data);
    } catch (err) {
      logger.error("Failed to fetch growth data", { err });
    }
  }, []);

  const fetchIndustryData = useCallback(async () => {
    try {
      const res = await adminAxiosInstance.get(
        "/admin/stats/mentor-industries",
      );
      setIndustryData(res.data);
    } catch (err) {
      logger.error("Failed to fetch industry data", { err });
    }
  }, []);

  const fetchUsers = useCallback(
    async (page = 1, q = search, role = roleFilter, blocked = showBlocked) => {
      try {
        setLoading(true);
        const params = { page, limit: 15 };
        if (q) params.search = q;
        if (role) params.role = role;
        if (blocked) params.deleted = true;

        const res = await adminAxiosInstance.get("/admin/users", { params });
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } catch {
        showToast({ message: "Failed to load users.", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, showBlocked],
  );

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchGrowthData();
    fetchIndustryData();
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => fetchUsers(1, val, roleFilter, showBlocked),
      400,
    );
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    fetchUsers(1, search, role, showBlocked);
  };

  const handleBlockedToggle = (isBlocked) => {
    setShowBlocked(isBlocked);
    fetchUsers(1, search, roleFilter, isBlocked);
  };

  const executeAction = async () => {
    if (!actionModal) return;
    const { user, mode } = actionModal;
    setActionLoading(true);

    try {
      if (mode === "delete") {
        await adminAxiosInstance.delete(`/admin/users/${user._id}`);
        showToast({ message: `${user.name} has been permanently deleted.` });
      } else if (mode === "block") {
        await adminAxiosInstance.patch(`/admin/users/${user._id}/block`, {});
        showToast({ message: `${user.name} has been blocked.` });
      } else if (mode === "unblock") {
        await adminAxiosInstance.patch(`/admin/users/${user._id}/unblock`, {});
        showToast({ message: `${user.name} has been restored.` });
      }

      setActionModal(null);
      fetchStats();
      fetchUsers(pagination.page);
      if (mode === "delete") fetchIndustryData();
    } catch (err) {
      showToast({ message: err?.response?.data?.message || "Action failed.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  let usersTableBody;
  if (loading) {
    usersTableBody = SKELETON_ROW_KEYS.map((rowKey) => (
      <tr key={rowKey} style={{ borderBottom: "1px solid #f1f5f9" }}>
        {SKELETON_COL_KEYS.map((colKey, j) => (
          <td key={colKey} className="px-6 py-4">
            <div
              className="h-4 rounded-lg animate-pulse"
              style={{
                background: "#f1f5f9",
                width: j === 0 ? 140 : 80,
              }}
            />
          </td>
        ))}
      </tr>
    ));
  } else if (users.length === 0) {
    usersTableBody = (
      <tr>
        <td
          colSpan={5}
          className="text-center py-16 text-sm text-slate-400"
        >
          No users found.
        </td>
      </tr>
    );
  } else {
    usersTableBody = users.map((user) => (
      <tr
        key={user._id}
        className="transition-colors"
        style={{ borderBottom: "1px solid #f1f5f9" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "#fafbfc")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={user.name}
              picture={user.profile?.profilePicture}
            />
            <div>
              <p
                className="text-sm font-600 text-slate-900"
                style={{ fontWeight: 600 }}
              >
                {user.name}{" "}
                {showBlocked && (
                  <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Blocked
                  </span>
                )}
              </p>
              <p
                className="text-[10px] text-slate-600"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {user.email}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3">
          <RoleBadge roles={user.roles} />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: user.isEmailVerified
                  ? "#22c55e"
                  : "#f59e0b",
              }}
            />
            <span className="text-xs text-slate-900">
              {user.isEmailVerified ? "Verified" : "Pending"}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className="text-xs text-slate-900"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {new Date(user.createdAt).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" },
            )}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {showBlocked ? (
              <button
                onClick={() =>
                  setActionModal({ user, mode: "unblock" })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600 transition-all hover:bg-green-100"
                style={{
                  background: "#f0fdf4",
                  color: "#15803d",
                  fontWeight: 600,
                  border: "1px solid #bbf7d0",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Unblock
              </button>
            ) : (
              <button
                onClick={() =>
                  setActionModal({ user, mode: "block" })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600 transition-all hover:bg-amber-100"
                style={{
                  background: "#fffbeb",
                  color: "#d97706",
                  fontWeight: 600,
                  border: "1px solid #fde68a",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line
                    x1="4.93"
                    y1="4.93"
                    x2="19.07"
                    y2="19.07"
                  />
                </svg>
                Block
              </button>
            )}
            <button
              onClick={() =>
                setActionModal({ user, mode: "delete" })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600 transition-all hover:bg-red-100"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                fontWeight: 600,
                border: "1px solid #fecaca",
              }}
            >
              <svg
                width="10"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
              Delete
            </button>
          </div>
        </td>
      </tr>
    ));
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-600 transition-all"
          style={{
            fontWeight: 600,
            background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: toast.type === "success" ? "#15803d" : "#dc2626",
          }}
        >
          {toast.type === "success" ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1
            className="text-3xl text-slate-900"
            style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            User Management
          </h1>
          <p className="text-sm text-slate-700 mt-1">
            Manage, verify, and monitor all platform participants.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers}
            sub={`+${stats?.newUsersThisMonth ?? 0} this month`}
            accent="#2563eb"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="15"
                  cy="8"
                  r="3"
                  fill="currentColor"
                  fillOpacity="0.25"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M18.5 19.5v-1a4 4 0 0 0-4-4h-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeOpacity="0.4"
                />
                <circle
                  cx="9"
                  cy="8"
                  r="3.5"
                  fill="currentColor"
                  fillOpacity="0.9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M2 20v-1.5A5 5 0 0 1 7 13.5h4A5 5 0 0 1 16 19v1"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            }
          />
          <StatCard
            label="Active Mentors"
            value={stats?.totalMentors}
            sub={`+${stats?.newMentorsThisMonth ?? 0} this month`}
            accent="#7c3aed"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="10"
                  cy="7"
                  r="3.5"
                  fill="currentColor"
                  fillOpacity="0.9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13h4a5.5 5.5 0 0 1 5.5 5.5V20"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="18.5"
                  cy="17.5"
                  r="3.5"
                  fill="currentColor"
                  fillOpacity="0.9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <polyline
                  points="16.8 17.5 18 18.8 20.2 16.2"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.4"
                />
              </svg>
            }
          />
          <StatCard
            label="Active Mentees"
            value={stats?.totalMentees}
            sub={`+${stats?.newMenteesThisMonth ?? 0} this month`}
            accent="#059669"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="10"
                  cy="7"
                  r="3.5"
                  fill="currentColor"
                  fillOpacity="0.9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13h4a5.5 5.5 0 0 1 5.5 5.5V20"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="18.5"
                  cy="17.5"
                  r="3.5"
                  fill="currentColor"
                  fillOpacity="0.9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <line
                  x1="18.5"
                  y1="15.5"
                  x2="18.5"
                  y2="19.5"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <line
                  x1="16.5"
                  y1="17.5"
                  x2="20.5"
                  y2="17.5"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <UserGrowthChart data={growthData} />
          <MentorIndustryChart data={industryData} />
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}
        >
          <div
            className="flex items-center justify-between gap-4 px-6 py-4 border-b"
            style={{ borderColor: "#e8eaf0" }}
          >
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleBlockedToggle(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-600 transition-all shadow-sm"
                style={{
                  background: showBlocked ? "transparent" : "#ffffff",
                  color: showBlocked ? "#64748b" : "#0f172a",
                }}
              >
                Active Users
              </button>
              <button
                onClick={() => handleBlockedToggle(true)}
                className="px-4 py-1.5 rounded-lg text-xs font-600 transition-all shadow-sm"
                style={{
                  background: showBlocked ? "#ffffff" : "transparent",
                  color: showBlocked ? "#d97706" : "#64748b",
                }}
              >
                Blocked Users
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {["", "mentor", "mentee"].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleFilter(r)}
                    className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all"
                    style={{
                      fontWeight: 600,
                      background: roleFilter === r ? "#2563eb" : "#f1f5f9",
                      color: roleFilter === r ? "white" : "#475569",
                    }}
                  >
                    {r === ""
                      ? "All Roles"
                      : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    width: 220,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#334155",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#93c5fd")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f1f5f9",
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  {["User", "Role", "Email Verified", "Joined", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-[10px] uppercase tracking-widest"
                        style={{
                          color: "#334155",
                          fontWeight: 800,
                          letterSpacing: "0.12em",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {usersTableBody}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div
              className="flex items-center justify-between px-6 py-4 border-t"
              style={{ borderColor: "#e8eaf0" }}
            >
              <p className="text-xs text-slate-600">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all disabled:opacity-30"
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all disabled:opacity-30"
                  style={{
                    background: "#2563eb",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {actionModal && (
        <ConfirmActionModal
          user={actionModal.user}
          mode={actionModal.mode}
          onConfirm={executeAction}
          onCancel={() => setActionModal(null)}
          loading={actionLoading}
        />
      )}
    </>
  );
};

export default AdminUserManagement;