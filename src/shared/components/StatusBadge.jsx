// src/components/common/StatusBadge.jsx
import PropTypes from "prop-types";
const STATUS_CONFIG = {
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
const StatusBadge = ({ status, variant = "admin" }) => {
  const cfg = STATUS_CONFIG[status] || {
    classes: "bg-slate-100 text-slate-500 border border-slate-200",
    dot: "bg-slate-500",
    label: status,
  };

  if (variant === "history") {
    return (
      <span
        className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full capitalize w-fit ${cfg.classes}`}
      >
        {cfg.label}
      </span>
    );
  }

  // variant === "admin" (default)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${cfg.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
StatusBadge.propTypes = {
  status: PropTypes.oneOf([
    "pending",
    "accepted",
    "ongoing",
    "completed",
    "rejected",
    "referred",
    "paid",
    "unpaid",
    "refunded",
    "cancelled", 
    "in_progress",
  ]).isRequired,
  variant: PropTypes.oneOf(["admin", "history"]),
};
export default StatusBadge;
