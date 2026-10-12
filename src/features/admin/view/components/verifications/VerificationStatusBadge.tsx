import type { ReactNode } from "react";
import { getOwn } from "@/shared/utils/getOwn";
import { IconCheck } from "./VerificationIcons";

interface VerificationStyle {
    background: string;
    color: string;
    label: string;
    icon: ReactNode;
}

// OCP: add a new verification status by adding an entry here.
const VERIFICATION_STYLES: Readonly<Record<string, VerificationStyle>> = {
    verified: {
        background: "#dcfce7",
        color: "#15803d",
        label: "Verified",
        icon: <IconCheck size={10} />,
    },
    pending: {
        background: "#fef9c3",
        color: "#a16207",
        label: "Pending",
        icon: <span style={{ fontSize: 9 }}>●</span>,
    },
};

// Any status without its own entry is shown as pending.
const VerificationStatusBadge = ({ status }: { status: string }) => {
    const cfg = getOwn(VERIFICATION_STYLES, status) ?? VERIFICATION_STYLES.pending;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: cfg.background, color: cfg.color }}
        >
            {cfg.icon}
            {` ${cfg.label}`}
        </span>
    );
};

export default VerificationStatusBadge;