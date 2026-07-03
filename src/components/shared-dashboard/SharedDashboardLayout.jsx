// src/components/shared-dashboard/SharedDashboardLayout.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SharedTopbar from "./SharedTopbar";
import SharedSidebar from "./SharedSidebar";
import SharedHomeTab from "./tabs/SharedHomeTab";
import SharedChatTab from "./tabs/SharedChatTab";
import SharedGoalsTab from "./tabs/SharedGoalsTab";
import SharedNotesTab from "./tabs/SharedNotesTab";
import SharedAdditionalSessionTab from "./tabs/SharedAdditionalSessionTab";
import { useSelector } from "react-redux";
import useSocketToast from "../../hooks/useSocketToast";
import { selectConnect } from "../../store/selectors";

const SharedDashboardLayout = ({
  onAllComplete,
  activeTab: activeTabProp,
  setActiveTab,
}) => {
  const activeTab = activeTabProp || "overview";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useSocketToast();
  const connect = useSelector(selectConnect);
  const viewerRole = connect?.viewerRole || "mentee";

  const backPath =
    viewerRole === "mentor" ? "/dashboard/mentor" : "/dashboard/mentee";

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Topbar */}
      <SharedTopbar
        viewerRole={viewerRole}
        onMenuToggle={() => setSidebarOpen(true)}
        onLogoClick={() => navigate(backPath)} // ✅ added
      />

      {/* Body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <SharedSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          viewerRole={viewerRole}
        />

        <main
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Home */}
          <div
            style={{
              display: activeTab === "overview" ? "block" : "none",
              height: "100%",
              overflowY: "auto",
              padding: "24px 32px",
            }}
          >
            <SharedHomeTab onTabChange={setActiveTab} />
          </div>

          {/* Chat — always mounted so socket stays alive */}
          <div
            style={{
              display: activeTab === "chat" ? "flex" : "none",
              flexDirection: "column",
              height: "100%",
              padding: "24px 32px",
              boxSizing: "border-box",
            }}
          >
            <SharedChatTab />
          </div>

          {/* Goals */}
          <div
            style={{
              display: activeTab === "goals" ? "block" : "none",
              height: "100%",
              overflowY: "auto",
              padding: "24px 32px",
            }}
          >
            <SharedGoalsTab onAllComplete={onAllComplete} />
          </div>

          {/* Notes */}
          <div
            style={{
              display: activeTab === "notes" ? "block" : "none",
              height: "100%",
              overflowY: "auto",
              padding: "24px 32px",
            }}
          >
            <SharedNotesTab />
          </div>

          {/* Add Session */}
          <div
            style={{
              display: activeTab === "addSession" ? "block" : "none",
              height: "100%",
              overflowY: "auto",
              padding: "24px 32px",
            }}
          >
            <SharedAdditionalSessionTab onTabChange={setActiveTab} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SharedDashboardLayout;
