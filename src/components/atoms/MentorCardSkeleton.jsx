// src/components/atoms/MentorCardSkeleton.jsx

const MentorCardSkeleton = ({ variant = "detailed" }) => {

    // ── Compact variant ─────────────────────────────────────────
    // Used in: mentee/HomeTab
    if (variant === "compact") {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <div className="h-5 w-16 bg-slate-100 rounded-full" />
                    <div className="h-5 w-12 bg-slate-100 rounded-full" />
                </div>
                <div className="h-8 bg-slate-200 rounded-xl" />
            </div>
        );
    }

    // ── Detailed variant (default) ──────────────────────────────
    // Used in: findMentors/MentorGrid
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded-xl" />
                    <div className="h-3 w-24 bg-slate-100 rounded-xl" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="h-3 w-40 bg-slate-100 rounded-xl" />
                <div className="h-3 w-28 bg-slate-100 rounded-xl" />
            </div>
            <div className="flex gap-2">
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-14 bg-slate-100 rounded-full" />
            </div>
            <div className="flex items-center justify-between mt-1">
                <div className="h-4 w-20 bg-slate-100 rounded-xl" />
                <div className="h-4 w-16 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-9 w-full bg-slate-200 rounded-xl" />
        </div>
    );
};

export default MentorCardSkeleton;