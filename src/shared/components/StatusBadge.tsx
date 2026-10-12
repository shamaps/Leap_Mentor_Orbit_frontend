// src/shared/components/StatusBadge.tsx
import { getOwn } from "@/shared/utils/getOwn";
import {
  STATUS_CONFIG,
  UNKNOWN_STATUS_STYLE,
  type StatusBadgeVariant,
  type StatusStyle,
} from "./statusBadge.config";

const StatusBadge = ({ status, variant = "admin" }: { status: string; variant?: StatusBadgeVariant }) => {
  const cfg: StatusStyle = getOwn(STATUS_CONFIG, status) ?? {
    ...UNKNOWN_STATUS_STYLE,
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

export default StatusBadge;