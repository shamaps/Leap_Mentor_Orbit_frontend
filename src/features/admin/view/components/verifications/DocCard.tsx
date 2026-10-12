import type { ReactNode } from "react";
import { IconDoc, IconExternalLink } from "./VerificationIcons";

// ── Doc Preview Card ─────────────────────────────────────
const DocCard = ({ label, url, icon }: { label: string; url?: string; icon?: ReactNode }) => {
    if (!url) return null;
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 hover:border-blue-300 hover:shadow-sm"
            style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}
        >
            <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#eff6ff", color: "#2563eb" }}
            >
                {isImage ? (
                    <img
                        src={url}
                        alt={label}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    icon || <IconDoc />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                    {isImage ? "Image" : "PDF / Document"} · Click to view
                </p>
            </div>
            <span className="text-slate-300 group-hover:text-blue-500 transition-colors">
                <IconExternalLink />
            </span>
        </a>
    );
};

export default DocCard;