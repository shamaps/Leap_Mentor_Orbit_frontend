// src/shared/components/statusBadge.config.ts
//
// OCP: to support a new status, add one entry to STATUS_CONFIG — the
// rendering code in StatusBadge.tsx does not change.

export interface StatusStyle {
    /** Tailwind classes for background, text, and border. */
    classes: string;
    /** Tailwind class for the dot shown in the admin variant. */
    dot: string;
    label: string;
}

export type StatusBadgeVariant = "admin" | "history";

export const STATUS_CONFIG: Readonly<Record<string, StatusStyle>> = {
    pending: {
        classes: "bg-amber-50 text-amber-600 border border-amber-200",
        dot: "bg-amber-600",
        label: "Pending",
    },
    accepted: {
        classes: "bg-blue-50 text-blue-600 border border-blue-200",
        dot: "bg-blue-600",
        label: "Accepted",
    },
    ongoing: {
        classes: "bg-violet-50 text-violet-600 border border-violet-200",
        dot: "bg-violet-600",
        label: "Ongoing",
    },
    completed: {
        classes: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        dot: "bg-emerald-600",
        label: "Completed",
    },
    rejected: {
        classes: "bg-red-50 text-red-500 border border-red-200",
        dot: "bg-red-500",
        label: "Rejected",
    },
    referred: {
        classes: "bg-orange-50 text-orange-600 border border-orange-200",
        dot: "bg-orange-600",
        label: "Referred",
    },
    paid: {
        classes: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        dot: "bg-emerald-600",
        label: "Paid",
    },
    unpaid: {
        classes: "bg-red-50 text-red-500 border border-red-200",
        dot: "bg-red-500",
        label: "Unpaid",
    },
    refunded: {
        classes: "bg-red-50 text-red-500 border border-red-200",
        dot: "bg-red-500",
        label: "Refunded"
    },
    cancelled: {
        classes: "bg-red-50 text-red-500 border border-red-200",
        dot: "bg-red-500",
        label: "Cancelled"
    },
    in_progress: {
        classes: "bg-amber-50 text-amber-600 border border-amber-200",
        dot: "bg-amber-600",
        label: "In Progress"
    },
};

export const UNKNOWN_STATUS_STYLE: Omit<StatusStyle, "label"> = {
    classes: "bg-slate-100 text-slate-500 border border-slate-200",
    dot: "bg-slate-500",
};