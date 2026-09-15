// src/components/mentee/dashboard/NotificationsTab.tsx
import type { ReactNode } from "react";
import { useNotifications, type NotificationItem } from "@/features/notifications/presenter/useNotifications";
import StatCard from "@/shared/components/StatCard";
import ErrorState from "@/shared/components/ErrorState";
import TabLoader from "@/shared/components/TabLoader";

// ── Type configurations & aliasing ───────────────────────────
const TYPE_ALIASES: Record<string, string> = { connect_request: "connect_request_received" };
const resolveType = (type: string) => TYPE_ALIASES[type] || type;

const BL_CFG = { bg: "bg-blue-100", stroke: "#3b82f6", tint: "bg-blue-50/60", border: "border-blue-200" };
const GR_CFG = { bg: "bg-green-100", stroke: "#22c55e", tint: "bg-green-50/60", border: "border-green-200" };
const SL_CFG = { bg: "bg-slate-100", stroke: "#64748b", tint: "bg-slate-50/80", border: "border-slate-200" };

interface TypeCfg {
  bg: string;
  stroke: string;
  tint: string;
  border: string;
  label: string;
}

const TYPE_CONFIG: Record<string, TypeCfg> = {
  connect_request_received: { ...BL_CFG, label: "Connect Request" },
  connect_request_accepted: { ...GR_CFG, label: "Accepted" },
  connect_request_declined: { bg: "bg-red-100", stroke: "#ef4444", label: "Declined", tint: "bg-red-50/40", border: "border-red-200" },
  upcoming_session: { ...BL_CFG, label: "Upcoming Session" },
  new_message: { ...SL_CFG, label: "New Message" },
  session_completed: { ...GR_CFG, label: "Session Completed" },
  new_review: { bg: "bg-yellow-100", stroke: "#f59e0b", label: "New Review", tint: "bg-yellow-50/60", border: "border-yellow-200" },
  feedback: { ...SL_CFG, stroke: "#94a3b8", label: "Feedback" },
};

// ── Shared icon paths ────────────────────────────────────────
const ICON_PEOPLE = (
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);
const ICON_STAR = <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />;
const ICON_CHECK = <polyline points="20 6 9 17 4 12" />;
const ICON_CALENDAR = (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>
);
const ICON_BELL = (
  <>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </>
);
const ICON_TRASH = (
  <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </>
);

const TYPE_ICON_PATH: Record<string, ReactNode> = {
  connect_request_received: ICON_PEOPLE,
  connect_request_accepted: ICON_CHECK,
  connect_request_declined: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  upcoming_session: ICON_CALENDAR,
  new_message: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
  session_completed: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  new_review: ICON_STAR,
  feedback: ICON_STAR,
};

// ── Helpers ──────────────────────────────────────────────────
const getInitials = (name = "") => {
  const cleanStr = name.replace(/^(New|Upcoming|Session)\s+/i, "").trim();
  return cleanStr.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "N";
};

const AVATAR_COLORS = ["bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-orange-500", "bg-pink-600", "bg-teal-600"];
const getAvatarColor = (id = "") => {
  const total = id.split("").reduce((acc, current) => acc + (current.codePointAt(0) ?? 0), 0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
};


// NOTE: normalizeApiNotif was previously defined here but is unused —
// notification normalization for this tab happens elsewhere in the hook.


// ── Static Mock Factory (Prevents Cross-File Duplications) ────
interface BuildMockArgs {
  id: string;
  type: string;
  time: string;
  title: string;
  sender: string;
  body: string;
  label?: string;
  primary?: boolean;
}

const buildMock = ({ id, type, time, title, sender, body, label, primary = false }: BuildMockArgs): NotificationItem => {
  let actions: { label: string; primary: boolean }[] = [];
  if (label) {
    actions = [{ label, primary }];
  } else if (id === "static-1") {
    actions = [{ label: "Accept", primary: true }, { label: "Decline", primary: false }];
  }
  return {
    id, type, read: id === "static-5", time, accent: type === "upcoming_session", title, senderName: sender, body,
    actions,
  };
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  buildMock({ id: "static-1", type: "connect_request", time: "2 minutes ago", title: "New Connect Request", sender: "Deepika S.", body: "Deepika (Mentee) has sent you a connect request. She's looking for career guidance in system design and interview preparation." }),
  buildMock({ id: "static-2", type: "upcoming_session", time: "45 minutes ago", title: "Upcoming Session", sender: "Chris Johnson", body: "Career Coaching with Chris Johnson today at 3:00 PM. Topic: Resume review and LinkedIn profile optimization.", label: "Start Session", primary: true }),
  buildMock({ id: "static-3", type: "new_message", time: "3 hours ago", title: "New Message", sender: "Emma Lee", body: 'Emma Lee: "Hi! I just updated my portfolio with the new projects we discussed. Could you take a look when you have a chance?"', label: "Reply", primary: true }),
  buildMock({ id: "static-4", type: "session_completed", time: "Yesterday", title: "Session Completed", sender: "Alex Carter", body: "Your session with Alex Carter has ended. Earnings of $55 have been released from escrow and added to your balance.", label: "View Earnings" }),
  buildMock({ id: "static-5", type: "feedback", time: "2 days ago", title: "New Review", sender: "Jessica Patel", body: 'Jessica Patel left you a 5-star rating: "Incredibly insightful session. The mentor had deep knowledge. Highly recommend!"' })
];

const resolveNavigation = (notif: NotificationItem, setActiveTab?: (tab: string) => void) => {
  if (!setActiveTab) return;
  const canonical = resolveType(notif.type);
  if (["connect_request_received", "connect_request_declined", "connect_request_accepted"].includes(canonical)) {
    setActiveTab("history");
  } else if (["upcoming_session", "new_message", "session_completed"].includes(canonical)) {
    setActiveTab("connects");
  } else if (canonical === "new_review") {
    setActiveTab("profile");
  } else if (canonical === "support_resolved") {
    setActiveTab("home");
  }
};

interface DeleteButtonProps {
  onDelete: (id: string) => void;
  notifId: string;
}

const DeleteButton = ({ onDelete, notifId }: DeleteButtonProps) => (
  <button
    onClick={(e) => { e.stopPropagation(); onDelete(notifId); }}
    title="Delete"
    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 bg-white border border-slate-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all duration-150"
  >
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      {ICON_TRASH}
    </svg>
  </button>
);

// ── Notification Card Component ───────────────────────────────
interface NotifCardProps {
  notif: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

const NotifCard = ({ notif, onMarkRead, onDelete, setActiveTab }: NotifCardProps) => {
  const typeKey = resolveType(notif.type);
  const cfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG["new_message"];
  const initials = getInitials(notif.senderName || notif.title);
  const avatarBg = getAvatarColor(notif.id);
  const handleActivate = () => {
    if (!notif.read) onMarkRead(notif.id);
    resolveNavigation(notif, setActiveTab);
  };
  return (
    <button
      type="button"
      onClick={handleActivate}
      onKeyDown={(e) => { if (e.key === "Enter") handleActivate(); }}
      className={`relative w-full text-left rounded-2xl border px-3.5 py-3.5 sm:px-5 sm:py-4 flex items-start gap-3 sm:gap-4 transition-all duration-200 hover:shadow-md group
    ${notif.read ? "bg-white border-slate-100 cursor-default" : `${cfg.tint} ${cfg.border} cursor-pointer`}
    ${notif.accent ? "border-l-[3px] border-l-blue-500" : ""}
  `}
    >
      {!notif.read && <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full bg-blue-500" />}
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${avatarBg} flex items-center justify-center shrink-0 shadow-sm`}>
        <span className="text-xs sm:text-sm font-bold text-white">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg}`} style={{ color: cfg.stroke }}>
              {cfg.label}
            </span>
            {!notif.read && <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">New</span>}
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-slate-400 shrink-0 whitespace-nowrap">{notif.time}</span>
        </div>
        <p className={`text-sm font-bold leading-snug ${notif.read ? "text-slate-600" : "text-slate-800"}`}>
          {notif.title}
          {notif.senderName && <span className={`font-medium ml-1.5 ${notif.read ? "text-slate-400" : "text-slate-500"}`}>· {notif.senderName}</span>}
        </p>
        <p className={`text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 ${notif.read ? "text-slate-400" : "text-slate-600"}`}>{notif.body}</p>
        {notif.actions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {notif.actions.map((action) => (
              <button
                key={action.label}
                onClick={(e) => e.stopPropagation()}
                className={`text-xs font-bold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all duration-150 ${action.primary ? "bg-blue-900 text-white hover:bg-blue-800 shadow-sm" : "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                  }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {TYPE_ICON_PATH[typeKey] || TYPE_ICON_PATH["new_message"]}
          </svg>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <DeleteButton onDelete={onDelete} notifId={notif.id} />
        </div>
      </div>
      <div className="sm:hidden shrink-0 self-start">
        <DeleteButton onDelete={onDelete} notifId={notif.id} />
      </div>
    </button>
  );
};

// ── Main Tab Component ───────────────────────────────────────
interface NotificationsTabProps {
  setActiveTab?: (tab: string) => void;
}

const NotificationsTab = ({ setActiveTab }: NotificationsTabProps) => {
  const { notifications, loading, error, fetchNotifications, markAllRead, clearAll, markRead, deleteOne } = useNotifications(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const thisWeekCount = notifications.filter((n) => {
    if (n.isApi) return true;
    const itemTime = n.time || "";
    return itemTime.includes("minute") || itemTime.includes("hour") || itemTime.toLowerCase() === "yesterday" || (itemTime.includes("day") && Number.parseInt(itemTime, 10) <= 7);
  }).length;

  if (loading) return <TabLoader message="Loading your notifications..." />

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm font-medium text-blue-900 mt-0.5">Manage your recent activities and requests.</p>
        </div>
        <div className="flex items-center gap-3 sm:mt-1 shrink-0">
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-s font-bold text-blue-900 hover:text-blue-700 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {ICON_CHECK}
            </svg>
            Mark all as read
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <button onClick={clearAll} className="flex items-center gap-1.5 text-s font-bold text-slate-500 hover:text-red-500 transition-colors">
            <svg width="13" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {ICON_TRASH}
            </svg>
            Clear all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          variant="simple" label="Total Notifications" value={notifications.length}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICON_BELL}</svg>}
        />
        <StatCard
          variant="simple" label="Unread" value={unreadCount} accent={unreadCount > 0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? "#3b82f6" : "#64748b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <StatCard
          variant="simple" label="This Week" value={thisWeekCount}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICON_CALENDAR}</svg>}
        />
      </div>

      {error && <ErrorState message={error} onAction={fetchNotifications} compact />}

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{ICON_BELL}</svg>
          </div>
          <p className="text-sm font-bold text-slate-800">No notifications</p>
          <p className="text-xs text-slate-600">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <NotifCard key={notif.id} notif={notif} onMarkRead={markRead} onDelete={deleteOne} setActiveTab={setActiveTab} />
          ))}
          <button className="w-full py-3 text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors">
            Load older notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;