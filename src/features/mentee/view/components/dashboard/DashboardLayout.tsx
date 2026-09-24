// src/components/mentee/dashboard/DashboardLayout.jsx
import { useState, useEffect } from "react";
import useMenteeDashboard from "../../../presenter/useMenteeDashboard";
import useUnreadCount from "@/features/shared-dashboard/presenter/useUnreadCount";
import DashboardTopbar from "@/shared/components/DashboardTopbar";
import HomeTab from "./HomeTab";
import ProfileTab from "./ProfileTab";
import FindMentorsTab from "./findMentors/FindMentorsTab";
import RequestHistoryTab from "./history/RequestHistoryTab";
import NotificationsTab from "@/features/notifications/view/NotificationsTab";
import MenteeConnectsTab from "@/features/connects/view/MenteeConnectsTab";
import HelpCenter from "@/shared/components/HelpCenter";
import useSocketToast from "@/features/shared-dashboard/presenter/useSocketToast.js";
import { Home, User, Search, Bell, History, Users } from "lucide-react";
import DashboardSidebar from "@/shared/components/DashboardSidebar";
import { useSearchParams, useNavigation } from "react-router-dom";
import ErrorState from "@/shared/components/ErrorState";
// ErrorState is still a plain JS component (migrates in Phase 3.5); its inferred
// prop types mark every prop as required. Cast locally to avoid coupling
// this migration to that one.

const ErrorStateAny = ErrorState as any;
const MENTEE_NAV_ITEMS = [
  { key: "home", label: "Home", icon: <Home size={16} /> },
  { key: "profile", label: "Profile", icon: <User size={16} /> },
  { key: "findMentors", label: "Find Mentors", icon: <Search size={16} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { key: "history", label: "History", icon: <History size={16} /> },
  { key: "connects", label: "Connects", icon: <Users size={16} /> },
];
const DashboardLayout = () => {
  const { loading, error } = useMenteeDashboard();
  const { unreadCount, clearBadge } = useUnreadCount();
  useSocketToast();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  useEffect(() => {
    const handler = (e: Event) => setActiveTab((e as CustomEvent<string>).detail);
    globalThis.addEventListener("setDashboardTab", handler);
    return () => globalThis.removeEventListener("setDashboardTab", handler);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally syncing local state from an external source (prop/URL), not derivable from render inputs alone
      setActiveTab(tab);
    }
  }, [searchParams]);
  const handleSetTab = (tab: string) => {
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
        <ErrorStateAny message={error} onAction={() => globalThis.location.reload()} />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Route-level navigation pending indicator — same pattern as
          AdminLayout's and the mentor DashboardLayout's. */}
      {isNavigating && (
        <div className="h-0.5 w-full bg-blue-100 overflow-hidden flex-shrink-0">
          <div className="h-full w-1/3 bg-blue-600 animate-pulse" />
        </div>
      )}
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