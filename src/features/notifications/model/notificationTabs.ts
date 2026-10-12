// OCP: where a mentor notification navigates is data, not control flow.
// To route a new notification type, add one entry to NOTIFICATION_TAB_BY_TYPE.
//
// The mentee notifications tab keeps its own navigation rules on purpose

export type MentorDashboardTab =
    | "requests"
    | "history"
    | "connects"
    | "profile"
    | "home";

export const NOTIFICATION_TAB_BY_TYPE: Readonly<Record<string, MentorDashboardTab>> = {
    connect_request_received: "requests",
    connect_request_declined: "requests",
    connect_request_accepted: "history",
    upcoming_session: "connects",
    new_message: "connects",
    session_completed: "connects",
    new_review: "profile",
    support_resolved: "home",
};

/** The tab a notification type opens, or undefined for unknown types. */
export const resolveNotificationTab = (type: string): MentorDashboardTab | undefined =>
    Object.prototype.hasOwnProperty.call(NOTIFICATION_TAB_BY_TYPE, type)
        ? NOTIFICATION_TAB_BY_TYPE[type]
        : undefined;