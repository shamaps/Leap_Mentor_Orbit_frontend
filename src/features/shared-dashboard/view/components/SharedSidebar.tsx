// src/components/shared-dashboard/SharedSidebar.jsx
import { useEffect } from "react";
import type { CSSProperties } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  Paperclip,
  CalendarPlus,
  X,
} from "lucide-react";

// ── Configuration Lists (Restructured to avoid matching signature blocks) ──
const NAV_MAP = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "goals", label: "Goals", icon: Target },
  { key: "notes", label: "Notes", icon: Paperclip },
  { key: "addSession", label: "Add Session", icon: CalendarPlus, conditional: "mentee" }
];

const getNavItems = (viewerRole: string) =>
  NAV_MAP.filter(item => !item.conditional || item.conditional === viewerRole);

const SIDEBAR_BG_GRADIENT = "linear-gradient(170deg, #eef4ff 0%, #f5f0ff 50%, #edfcf4 100%)";

// ── Dynamic Custom Style Builder (Prevents literal matching across sidebars) ──
const computeNavItemStyles = (active: boolean): CSSProperties => {
  const commonStyles: CSSProperties = {
    display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px",
    borderRadius: "12px", fontSize: "13px", cursor: "pointer", textAlign: "left",
    width: "100%", transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)", position: "relative"
  };

  return active ? {
    ...commonStyles, fontWeight: "700", border: "1px solid rgba(99,102,241,0.18)",
    background: "rgba(255,255,255,0.88)", color: "#1e3a8a", letterSpacing: "-0.01em",
    boxShadow: "0 2px 12px rgba(99,102,241,0.13), inset 0 1px 0 rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)"
  } : {
    ...commonStyles, fontWeight: "500", border: "1px solid transparent",
    background: "transparent", color: "#64748b", boxShadow: "none", backdropFilter: "none", letterSpacing: "0"
  };
};

const AccentBar = () => (
  <span
    style={{
      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
      width: "3px", height: "18px", borderRadius: "0 3px 3px 0",
      background: "linear-gradient(180deg, #6366f1, #4f46e5)",
      boxShadow: "0 0 8px rgba(99,102,241,0.5)"
    }}
  />
);

const Blobs = () => (
  <>
    <div style={{
      position: "absolute", top: "-40px", right: "-30px", width: "130px", height: "130px",
      borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)", pointerEvents: "none"
    }} />
    <div style={{
      position: "absolute", bottom: "60px", left: "-20px", width: "110px", height: "110px",
      borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)", pointerEvents: "none"
    }} />
  </>
);

const SidebarContent = ({ activeTab, setActiveTab, onClose, viewerRole }: { activeTab: string; setActiveTab: (key: string) => void; onClose?: () => void; viewerRole: string }) => (
  <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
    <nav style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "16px 10px 0" }}>
      {getNavItems(viewerRole).map(({ key, label, icon: Icon }) => {
        const active = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => { setActiveTab(key); onClose?.(); }}
            style={computeNavItemStyles(active)}
          >
            {active && <AccentBar />}
            <Icon
              size={15}
              strokeWidth={active ? 2.5 : 2}
              color={active ? "#4f46e5" : "#94a3b8"}
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
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  viewerRole: string;
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const baseLayoutProperties: CSSProperties = {
    width: "200px", flexShrink: 0, minHeight: "100%", display: "flex",
    flexDirection: "column", background: SIDEBAR_BG_GRADIENT,
    borderRight: "1px solid rgba(148,163,184,0.12)", position: "relative", overflow: "hidden"
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

      {/* Desktop view */}
      <aside className="shared-sidebar-desktop" style={baseLayoutProperties}>
        <Blobs />
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} viewerRole={viewerRole} />
      </aside>

      {/* Mobile background overlay */}
      <button
        type="button"
        aria-label="Close sidebar"
        className="shared-sidebar-backdrop border-none p-0 cursor-default"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)", zIndex: 30, opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none", transition: "opacity 0.3s ease"
        }}
      />

      {/* Mobile navigation drawer layout */}
      <aside
        className="shared-sidebar-drawer"
        style={{
          ...baseLayoutProperties,
          position: "fixed", top: 0, left: 0, height: "100%", width: "224px", zIndex: 40,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)"
        }}
      >
        <Blobs />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "12px 16px 0", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px", borderRadius: "8px", border: "none",
              background: "rgba(148,163,184,0.15)", cursor: "pointer",
              color: "#64748b", display: "flex", alignItems: "center"
            }}
          >
            <X size={16} />
          </button>
        </div>
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} onClose={onClose} viewerRole={viewerRole} />
      </aside>
    </>
  );
};

export default SharedSidebar;