// src/components/mentee/dashboard/DashboardLayout.jsx
import { useState, useEffect } from "react";
import useMenteeDashboard from "../../../hooks/useMenteeDashboard";
import useUnreadCount from "../../../hooks/useUnreadCount";
import DashboardTopbar from "../../common/DashboardTopbar";
import HomeTab from "./HomeTab";
import ProfileTab from "./ProfileTab";
import FindMentorsTab from "./findMentors/FindMentorsTab";
import RequestHistoryTab from "./history/RequestHistoryTab";
import NotificationsTab from "../notifications/NotificationsTab";
import MenteeConnectsTab from "./connects/MenteeConnectsTab";
import HelpCenter from "../../common/HelpCenter";
import useSocketToast from "../../../hooks/useSocketToast";
import { Home, User, Search, Bell, History, Users } from "lucide-react";
import DashboardSidebar from "../../common/DashboardSidebar";
import { useSearchParams } from "react-router-dom";
import ErrorState from "../../common/ErrorState";
const MENTEE_NAV_ITEMS = [
  { key: "home", label: "Home", icon: <Home size={16} /> },
  { key: "profile", label: "Profile", icon: <User size={16} /> },
  { key: "findMentors", label: "Find Mentors", icon: <Search size={16} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { key: "history", label: "History", icon: <History size={16} /> },
  { key: "connects", label: "Connects", icon: <Users size={16} /> },
];
const DashboardLayout = () => {
  const { user, profile, loading, error } = useMenteeDashboard();
  const { unreadCount, clearBadge } = useUnreadCount();
  useSocketToast();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener("setDashboardTab", handler);
    return () => window.removeEventListener("setDashboardTab", handler);
  }, []);
  // Clear badge when notifications tab is opened
  useEffect(() => {
    if (activeTab === "notifications") clearBadge();
  }, [activeTab, clearBadge]);

  // Deep link: read ?tab= from URL on mount (e.g. from email links)
    useEffect(() => {
      const tab = searchParams.get("tab");
      const validTabs = ["home", "profile", "findMentors", "history", "notifications", "connects", "help"];
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
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <ErrorState message={error} onAction={() => window.location.reload()} />
      </div>
    );
  }
  {
    /*}
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }
  */
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardTopbar onMenuToggle={() => setSidebarOpen(true)} onLogoClick={() => handleSetTab("home")} />

      <div className="flex flex-1">
        <DashboardSidebar navItems={MENTEE_NAV_ITEMS} activeTab={activeTab} setActiveTab={handleSetTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} unreadCount={unreadCount} />
        <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto">
          {activeTab === "home" && <HomeTab />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "findMentors" && <FindMentorsTab />}
          {activeTab === "history" && <RequestHistoryTab />}
          {activeTab === "notifications" && (
            <NotificationsTab setActiveTab={handleSetTab} />
          )}
          {activeTab === "connects" && <MenteeConnectsTab />}
          {activeTab === "help" && <HelpCenter />}
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
