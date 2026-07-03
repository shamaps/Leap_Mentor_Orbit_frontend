// src/components/shared-dashboard/SharedSidebar.jsx
import { useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  Paperclip,
  CalendarPlus,
  X,
} from "lucide-react";

const getNavItems = (viewerRole) => [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "goals", label: "Goals", icon: Target },
  { key: "notes", label: "Notes", icon: Paperclip },
  ...(viewerRole === "mentee"
    ? [{ key: "addSession", label: "Add Session", icon: CalendarPlus }]
    : []),
];

const sidebarBg =
  "linear-gradient(170deg, #eef4ff 0%, #f5f0ff 50%, #edfcf4 100%)";

const navItemStyle = (isActive) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "9px 12px",
  borderRadius: "12px",
  fontSize: "13px",
  fontWeight: isActive ? "700" : "500",
  border: isActive
    ? "1px solid rgba(99,102,241,0.18)"
    : "1px solid transparent",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
  position: "relative",
  background: isActive ? "rgba(255,255,255,0.88)" : "transparent",
  color: isActive ? "#1e3a8a" : "#64748b",
  boxShadow: isActive
    ? "0 2px 12px rgba(99,102,241,0.13), inset 0 1px 0 rgba(255,255,255,0.9)"
    : "none",
  backdropFilter: isActive ? "blur(8px)" : "none",
  letterSpacing: isActive ? "-0.01em" : "0",
});

const AccentBar = () => (
  <span
    style={{
      position: "absolute",
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
      width: "3px",
      height: "18px",
      borderRadius: "0 3px 3px 0",
      background: "linear-gradient(180deg, #6366f1, #4f46e5)",
      boxShadow: "0 0 8px rgba(99,102,241,0.5)",
    }}
  />
);

const Blobs = () => (
  <>
    <div
      style={{
        position: "absolute",
        top: "-40px",
        right: "-30px",
        width: "130px",
        height: "130px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: "60px",
        left: "-20px",
        width: "110px",
        height: "110px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }}
    />
  </>
);

const SidebarContent = ({ activeTab, setActiveTab, onClose, viewerRole }) => (
  <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "16px 10px 0",
      }}
    >
      {getNavItems(viewerRole).map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              onClose?.();
            }}
            style={navItemStyle(isActive)}
          >
            {isActive && <AccentBar />}
            <Icon
              size={15}
              strokeWidth={isActive ? 2.5 : 2}
              color={isActive ? "#4f46e5" : "#94a3b8"}
              style={{ flexShrink: 0, transition: "color 0.18s" }}
            />
            {label}
          </button>
        );
      })}
    </nav>
  </div>
);

const SharedSidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  viewerRole,
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const asideStyle = {
    width: "200px",
    flexShrink: 0,
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    background: sidebarBg,
    borderRight: "1px solid rgba(148,163,184,0.12)",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <>
      <style>{`
        .shared-sidebar-desktop  { display: flex; }
        .shared-sidebar-backdrop { display: none; }
        .shared-sidebar-drawer   { display: none; }
        @media (max-width: 767px) {
          .shared-sidebar-desktop  { display: none !important; }
          .shared-sidebar-backdrop { display: block; }
          .shared-sidebar-drawer   { display: flex; }
        }
      `}</style>

      {/* Desktop */}
      <aside className="shared-sidebar-desktop" style={asideStyle}>
        <Blobs />
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewerRole={viewerRole}
        />
      </aside>

      {/* Mobile backdrop */}
      <div
        className="shared-sidebar-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 30,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Mobile drawer */}
      <aside
        className="shared-sidebar-drawer"
        style={{
          ...asideStyle,
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: "224px",
          zIndex: 40,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Blobs />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "12px 16px 0",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "6px",
              borderRadius: "8px",
              border: "none",
              background: "rgba(148,163,184,0.15)",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={onClose}
          viewerRole={viewerRole}
        />
      </aside>
    </>
  );
};

export default SharedSidebar;
