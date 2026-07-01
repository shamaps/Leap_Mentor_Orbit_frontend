// src/components/mentee/dashboard/DashboardLayout.jsx
import { useState, useEffect } from "react";
import useMenteeDashboard from "../../../hooks/useMenteeDashboard";
import useUnreadCount from "../../../hooks/useUnreadCount";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import HomeTab from "./HomeTab";
import ProfileTab from "./ProfileTab";
import FindMentorsTab from "./findMentors/FindMentorsTab";
import RequestHistoryTab from "./history/RequestHistoryTab";
import NotificationsTab from "../notifications/NotificationsTab";
import MenteeConnectsTab from "./connects/MenteeConnectsTab";
import HelpCenter from "../../common/HelpCenter";
import useSocketToast from "../../../hooks/useSocketToast"; 

const DashboardLayout = () => {
  const { user, profile, loading, error } = useMenteeDashboard();
  const { unreadCount, clearBadge } = useUnreadCount();
  useSocketToast();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  const validTabs = ["home", "profile", "findMentors", "history", "notifications", "connects", "help"];
  if (tab && validTabs.includes(tab)) {
    setActiveTab(tab);
  }
}, []);
  const handleSetTab = (tab) => {
  setActiveTab(tab);
  setSidebarOpen(false);
  const url = new URL(window.location.href);
  if (tab === "home") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", tab);
  }
  window.history.replaceState(null, "", url.toString());
};
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
          <span className="text-red-500">⚠</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }
{/*}
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
  */}

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar onMenuToggle={() => setSidebarOpen(true)} onLogoClick={() => handleSetTab("home")} />      
      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleSetTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          unreadCount={unreadCount}
        />
        <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto">
          {activeTab === "home" && <HomeTab />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "findMentors"   && <FindMentorsTab />}
          {activeTab === "history"       && <RequestHistoryTab />}
          {activeTab === "notifications" && <NotificationsTab setActiveTab={handleSetTab} />}
          {activeTab === "connects"      && <MenteeConnectsTab />}
          {activeTab === "help"          && <HelpCenter />}
          
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
