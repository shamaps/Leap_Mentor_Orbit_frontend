const PrefsCardHeader = ({ title = "Mentorship Preferences", variant = "card" }) => (
    <div className={
        variant === "section"
            ? "flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50"
            : "flex items-center gap-2 mb-4"
    }>
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
);

export default PrefsCardHeader;