// src/components/atoms/StatCard.jsx
import PropTypes from "prop-types";
const StatCard = ({
    label,
    value,
    sub,
    subColor = "text-emerald-500",
    icon,
    accent,
    trend,
    variant = "admin",
}) => {

    // ── Simple variant (mentee + mentor NotificationsTab) ─────────
    if (variant === "simple") {
        return (
            <div className={`flex items-center gap-3 bg-white rounded-2xl border px-4 py-3.5 flex-1 min-w-0 ${accent ? "border-blue-200 bg-blue-50/40" : "border-slate-100"}`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-blue-100" : "bg-slate-100"}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-none">{value}</p>
                    <p className={`text-[10px] sm:text-xs font-semibold mt-1 leading-tight ${accent ? "text-blue-600" : "text-slate-500"}`}>
                        {label}
                    </p>
                </div>
            </div>
        );
    }

    // ── Home variant (MentorHomeTab) ──────────────────────────────
    if (variant === "home") {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xl font-extrabold text-slate-800 leading-none truncate">{value}</p>
                    {sub && <p className="text-[14px] text-blue-900 mt-0.5">{sub}</p>}
                    <p className="text-xs font-bold text-blue-900 mt-1">{label}</p>
                </div>
            </div>
        );
    }

    // ── Earnings variant (TrackEarningsTab) ───────────────────────
    if (variant === "earnings") {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col gap-1 min-w-0">
                <p className="text-xs text-slate-700 font-semibold">{label}</p>
                <div className="flex items-end gap-2 flex-wrap">
                    <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
                    {sub && (
                        <span className={`text-xs font-bold mb-0.5 flex items-center gap-0.5 ${subColor}`}>
                            {sub}
                        </span>
                    )}
                </div>
                {icon && <div className="mt-1 text-slate-300">{icon}</div>}
            </div>
        );
    }

    // ── Admin variant (default) ───────────────────────────────────
    const accentColor = typeof accent === "string" ? accent : "#2563eb";
    return (
        <div
            className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}
        >
            <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${accentColor}12, transparent 70%)` }}
            />

            <div className="flex items-center justify-between">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accentColor}14` }}
                >
                    <span style={{ color: accentColor }}>{icon}</span>
                </div>

                {trend !== undefined && (
                    <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ background: trend >= 0 ? "#f0fdf4" : "#fef2f2" }}
                    >
                        <svg
                            width="10" height="10" viewBox="0 0 24 24" fill="none"
                            stroke={trend >= 0 ? "#16a34a" : "#dc2626"}
                            strokeWidth="2.5" strokeLinecap="round"
                        >
                            {trend >= 0 ? (
                                <><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></>
                            ) : (
                                <><line x1="7" y1="7" x2="17" y2="17" /><polyline points="17 7 17 17 7 17" /></>
                            )}
                        </svg>
                        <span
                            className="text-[10px]"
                            style={{ color: trend >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}
                        >
                            {Math.abs(trend)}%
                        </span>
                    </div>
                )}
            </div>

            <div>
                <p className="text-2xl text-slate-800 leading-none" style={{ fontWeight: 700 }}>
                    {value?.toLocaleString() ?? "—"}
                </p>
                <p className="text-xs text-slate-700 mt-1" style={{ fontWeight: 500 }}>{label}</p>
                {sub && <p className={`text-[10px] mt-0.5 ${subColor}`}>{sub}</p>}
            </div>
        </div>
    );
};
StatCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sub: PropTypes.string,
    subColor: PropTypes.string,
    icon: PropTypes.node,
    accent: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    trend: PropTypes.number,
    variant: PropTypes.oneOf(["admin", "simple", "home", "earnings"]),
};
export default StatCard;