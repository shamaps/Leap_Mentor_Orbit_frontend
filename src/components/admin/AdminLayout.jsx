// src/components/admin/AdminLayout.jsx
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import { Outlet } from "react-router-dom";
import { IMAGES } from "../../constants/images";
import logger from "../../utils/logger";
const NAV_ITEMS = [
  {
    group: "MAIN MENU",
    links: [
      {
        to: "/admin/users",
        label: "User Management",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        to: "/admin/verifications",
        label: "Verifications",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
      },
      {
        to: "/admin/engagements",
        label: "Engagements",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        to: "/admin/reports",
        label: "Reports",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
      {
        to: "/admin/payments",
        label: "Payment Tracking",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        ),
      },
      {
        to: "/admin/support",
        label: "Support Messages",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
      {
        to: "/admin/wallet-requests",
        label: "Wallet Requests",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 12V22H4V12" />
            <path d="M22 7H2v5h20V7z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        ),
        badge: false,
      },
    ],
  },
  {
    group: "SYSTEM",
    links: [
      {
        to: "/admin/settings",
        label: "Settings",
        icon: (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingWalletCount, setPendingWalletCount] = useState(0);
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState({ name: "Admin" });

  // ← UPDATED: fetch admin info from API since we no longer store in localStorage
  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const res = await adminAxiosInstance.get("/admin/auth/me");
        setAdminUser(res.data.admin || { name: "Admin" });
      } catch {
        // silent — name just shows as "Admin" if fails
      }
    };
    fetchAdminUser();
  }, []);

  // ── Fetch pending wallet request count for sidebar badge ──
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await adminAxiosInstance.get(
          "/admin/leap-requests/pending-count",
        );
        setPendingWalletCount(res.data.count ?? 499);
      } catch {
        // silent — badge just won't show if this fails
      }
    };

    fetchPendingCount();
    // Re-poll every 60 seconds so badge stays fresh
    const interval = setInterval(fetchPendingCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      // ← UPDATED: must call backend to clear the httpOnly cookie
      // JS cannot clear an httpOnly cookie — only the server can
      await adminAxiosInstance.post("/admin/auth/logout");
    } catch (err) {
      // even if request fails, redirect to login
      logger.error("[AdminLayout] Logout request failed", {
        status: err?.response?.status,
        message: err.message,
      });
    }
    navigate("/admin/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#f0f2f7", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* ── Mobile backdrop ───────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(2px)",
          }}
          onClick={closeSidebar}
        />
      )}

      {/* ══════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col w-56 flex-shrink-0 h-full
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "#ffffff", borderRight: "1px solid #e8eaf0" }}
      >
        {/* Logo row */}
        <div
          className="flex items-center justify-between px-3 py-3 border-b flex-shrink-0"
          style={{ borderColor: "#e8eaf0" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
              <img
                src={IMAGES.logo}
                alt="LeapMentor logo"
                width={32}
                height={32}
              />
            </div>
            <div>
              <p
                className="text-sm text-slate-800 leading-none"
                style={{ fontWeight: 700 }}
              >
                LeapMentor
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "#2563eb", fontWeight: 600 }}
              >
                Admin
              </p>
            </div>
          </div>

          {/* Close — mobile only */}
          <button
            onClick={closeSidebar}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_ITEMS.map((section) => (
            <div key={section.group}>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 px-3 mb-2">
                {section.group}
              </p>
              <div className="space-y-1">
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150
                        ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`shrink-0 transition-colors duration-150 ${isActive ? "text-white" : "text-slate-400"}`}
                        >
                          {link.icon}
                        </span>
                        <span
                          className={`flex-1 truncate ${isActive ? "text-white" : "text-slate-700"}`}
                        >
                          {link.label}
                        </span>

                        {/* Pending badge — only on Wallet Requests when not active */}
                        {link.badge &&
                          pendingWalletCount < 500 &&
                          !isActive && (
                            <span
                              className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center
                            rounded-full text-[9px] font-extrabold px-1"
                              style={{ background: "#f59e0b", color: "#fff" }}
                            >
                              {pendingWalletCount > 99
                                ? "99+"
                                : pendingWalletCount}
                            </span>
                          )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div
          className="px-4 py-4 border-t flex-shrink-0"
          style={{ borderColor: "#e8eaf0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white flex-shrink-0"
              style={{ background: "#2563eb", fontWeight: 700 }}
            >
              {adminUser.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs text-slate-700 truncate"
                style={{ fontWeight: 600 }}
              >
                {adminUser.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {adminUser.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-4 lg:px-8 py-4 flex-shrink-0"
          style={{ background: "#ffffff", borderBottom: "1px solid #e8eaf0" }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {/* System Online / Logout */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "#1e3a8a", border: "1px solid #bae6fd" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <button
              onClick={handleLogout}
              className="hidden sm:inline text-xs text-white"
              style={{ fontWeight: 600 }}
            >
              Logout
            </button>
            <button
              onClick={handleLogout}
              className="sm:hidden text-xs text-white"
              style={{ fontWeight: 600 }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          <Outlet />  
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
