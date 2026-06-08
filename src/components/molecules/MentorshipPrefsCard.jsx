// src/components/molecules/MentorshipPrefsCard.jsx

const COMM_ICONS = {
    "Chat": "💬",
    "Video Call": "🎥",
    "Email": "✉️",
    "Phone Call": "📞",
    "In-Person": "🤝",
};

const MentorshipPrefsCard = ({ profile, variant = "mentee" }) => {
    const commPrefs = profile?.communicationPreferences || [];
    const languages = profile?.languages || [];

    // ── Mentor variant ─────────────────────────────────────────
    if (variant === "mentor") {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Mentorship Preferences</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-2">Communication Channels</p>
                        {commPrefs.length === 0 ? (
                            <p className="text-sm text-slate-500">—</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {commPrefs.map((pref) => (
                                    <span key={pref} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200">
                                        <span>{COMM_ICONS[pref] || "💬"}</span>
                                        {pref}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Languages</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {languages.length > 0 ? languages.join(", ") : "—"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Mentee variant (default) ───────────────────────────────
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-m font-bold text-slate-800 mb-4">Mentorship Preferences</h3>

            <div className="space-y-4">
                <div>
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">
                        Communication Methods
                    </p>
                    {commPrefs.length === 0 ? (
                        <p className="text-sm text-slate-700">—</p>
                    ) : (
                        <div className="space-y-0">
                            {commPrefs.map((pref) => (
                                <div key={pref} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                    <span className="text-sm text-slate-600">
                                        {pref === "Chat" ? "Instant Messaging / Chat"
                                            : pref === "Video Call" ? "Video Conferences"
                                                : pref === "Email" ? "Email Correspondence"
                                                    : pref}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">
                        Languages
                    </p>
                    {languages.length === 0 ? (
                        <p className="text-sm text-slate-400">—</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {languages.map((lang) => (
                                <span key={lang} className="text-xs font-semibold text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-wide">
                                    {lang}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentorshipPrefsCard;