// src/components/mentor/dashboard/DashboardLayout.jsx
import { useState, useEffect, lazy, Suspense } from "react";
import useMentorDashboard from "../../../hooks/useMentorDashboard";
import useUnreadCount from "../../../hooks/useUnreadCount";
import DashboardTopbar from "../../common/DashboardTopbar";
import useSocketToast from "../../../hooks/useSocketToast";
import { useSearchParams } from "react-router-dom";
import { Home, User, Calendar, Bell, MessageSquare, Users, DollarSign } from "lucide-react";
import DashboardSidebar from "../../common/DashboardSidebar";
import ErrorState from "../../common/ErrorState";
// LCP FIX: lazy-load every tab so only the active tab's JS is loaded.
// MentorHomeTab is also lazy — its chunk was 120 KiB and is the first thing
// the user sees, but it still loads faster than blocking the entire shell.
const MentorHomeTab = lazy(() => import("./MentorHomeTab"));
const ProfileTab = lazy(() => import("./ProfileTab"));
const AvailabilityTab = lazy(() => import("./availability/AvailabilityTab"));
const RequestsTab = lazy(() => import("./requests/RequestsTab"));
const MentorConnectsTab = lazy(() => import("./connects/MentorConnectsTab"));
const NotificationsTab = lazy(() => import("./notifications/NotificationsTab"));
const TrackEarningsTab = lazy(() => import("./earnings/TrackEarningsTab"));
const HelpCenter = lazy(() => import("../../common/HelpCenter"));

const MENTOR_NAV_ITEMS = [
  { key: "home", label: "Home", icon: <Home size={16} /> },
  { key: "profile", label: "Profile", icon: <User size={16} /> },
  { key: "availability", label: "Availability", icon: <Calendar size={16} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { key: "requests", label: "Requests", icon: <MessageSquare size={16} /> },
  { key: "connects", label: "Connects", icon: <Users size={16} /> },
  { key: "earnings", label: "Track Earnings", icon: <DollarSign size={16} /> },
];
// ── Tab skeleton — shown while a lazy tab chunk is loading ───
const TabSkeleton = () => (
  <div className="w-full flex flex-col gap-4 animate-pulse pt-2">
    <div className="h-7 w-48 bg-slate-200 rounded-xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-100 p-5 h-24"
        />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 h-48" />
      <div className="bg-white rounded-2xl border border-slate-100 p-5 h-48" />
    </div>
  </div>
);

const DashboardLayout = () => {
  const { user, profile, loading, error, refetchProfile } =
    useMentorDashboard();
  const { unreadCount, clearBadge } = useUnreadCount();
  useSocketToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeTab === "notifications") clearBadge();
  }, [activeTab, clearBadge]);

  // Deep link: read ?tab= from URL on mount (e.g. from email links)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const validTabs = ["home",
      "profile",
      "availability",
      "requests",
      "connects",
      "notifications",
      "earnings",
      "help"];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSetTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    if (tab === "home") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <ErrorState message={error} onAction={refetchProfile} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p
            className="text-xs text-slate-400"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardTopbar onMenuToggle={() => setSidebarOpen(true)} onLogoClick={() => handleSetTab("home")} />
      <div className="flex flex-1">
        <DashboardSidebar navItems={MENTOR_NAV_ITEMS} activeTab={activeTab} setActiveTab={handleSetTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} unreadCount={unreadCount} />
        <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto">
          {/* Suspense wraps all tabs — fallback shows a content skeleton
              while the lazy chunk downloads on first visit to that tab */}
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === "home" && (
              <MentorHomeTab setActiveTab={handleSetTab} />
            )}
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "availability" && <AvailabilityTab />}
            {activeTab === "requests" && <RequestsTab />}
            {activeTab === "connects" && <MentorConnectsTab />}
            {activeTab === "notifications" && (
              <NotificationsTab setActiveTab={handleSetTab} />
            )}
            {activeTab === "earnings" && <TrackEarningsTab />}
            {activeTab === "help" && <HelpCenter />}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
