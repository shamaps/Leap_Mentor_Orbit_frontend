// src/components/common/DashboardSidebar.jsx
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { HelpCircle, X } from "lucide-react";
const sidebarBg =
    "linear-gradient(170deg, #eef4ff 0%, #f5f0ff 50%, #edfcf4 100%)";

const navItemStyle = (isActive: boolean): CSSProperties => ({
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
            className="sidebar-blob-top"
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
            className="sidebar-blob-bottom"
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

const Badge = ({ count }: { count?: number }) => {
    if (!count) return null;
    return (
        <span
            style={{
                marginLeft: "auto",
                minWidth: "18px",
                height: "18px",
                padding: "0 5px",
                borderRadius: "9px",
                background: "#ef4444",
                color: "#fff",
                fontSize: "10px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
            }}
        >
            {count > 99 ? "99+" : count}
        </span>
    );
};

const SidebarContent = ({
    navItems,
    activeTab,
    setActiveTab,
    onClose,
    unreadCount,
}: {
    navItems: Array<{ key: string; label: string; icon: ReactNode }>;
    activeTab: string;
    setActiveTab: (key: string) => void;
    onClose?: () => void;
    unreadCount?: number;
}) => (
    <div
        style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
        }}
    >
        <nav
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: "16px 10px 0",
            }}
        >
            {navItems.map(({ key, label, icon }) => {
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
                        <span
                            style={{
                                flexShrink: 0,
                                display: "flex",
                                color: isActive ? "#4f46e5" : "#94a3b8",
                                transition: "color 0.18s",
                            }}
                        >
                            {icon}
                        </span>
                        {label}
                        {key === "notifications" && <Badge count={unreadCount} />}
                    </button>
                );
            })}
        </nav>

        {/* Support / Help section */}
        <div
            style={{
                padding: "10px",
                borderTop: "1px solid rgba(148,163,184,0.14)",
            }}
        >
            <button
                onClick={() => {
                    setActiveTab("help");
                    onClose?.();
                }}
                style={navItemStyle(activeTab === "help")}
            >
                {activeTab === "help" && <AccentBar />}
                <HelpCircle
                    size={15}
                    strokeWidth={activeTab === "help" ? 2.5 : 2}
                    color={activeTab === "help" ? "#4f46e5" : "#94a3b8"}
                    style={{ flexShrink: 0 }}
                />
                Help Center
            </button>
        </div>
    </div>
);

const DashboardSidebar = ({
    navItems,
    activeTab,
    setActiveTab,
    isOpen,
    onClose,
    unreadCount = 0,
}: {
    navItems: Array<{ key: string; label: string; icon: ReactNode }>;
    activeTab: string;
    setActiveTab: (key: string) => void;
    isOpen: boolean;
    onClose?: () => void;
    unreadCount?: number;
}) => {
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const asideStyle: CSSProperties = {
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
        .dashboard-sidebar-desktop  { display: flex; }
        .dashboard-sidebar-backdrop { display: none; }
        .dashboard-sidebar-drawer   { display: none; }
        @media (max-width: 767px) {
          .dashboard-sidebar-desktop  { display: none !important; }
          .dashboard-sidebar-backdrop { display: block; }
          .dashboard-sidebar-drawer   { display: flex; }
        }
      `}</style>

            {/* Desktop */}
            <aside className="dashboard-sidebar-desktop sidebar-root" style={asideStyle}>
                <Blobs />
                <SidebarContent
                    navItems={navItems}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    unreadCount={unreadCount}
                />
            </aside>

            {/* Mobile backdrop */}
            <button
                type="button"
                className="dashboard-sidebar-backdrop"
                onClick={onClose}
                aria-label="Close sidebar"
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15,23,42,0.5)",
                    backdropFilter: "blur(4px)",
                    zIndex: 30,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                    transition: "opacity 0.3s ease",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                }}
            />

            {/* Mobile drawer */}
            <aside
                className="dashboard-sidebar-drawer sidebar-root"
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
                    navItems={navItems}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onClose={onClose}
                    unreadCount={unreadCount}
                />
            </aside>
        </>
    );
};

export default DashboardSidebar;