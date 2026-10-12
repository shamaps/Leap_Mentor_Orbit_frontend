import { useState } from "react";
import Spinner from "@/shared/components/Spinner";

const CompletionSection = ({
    menteeMarked = false,
    mentorMarked = false,
    viewerRole,
    otherName,
    onMarkComplete,
    onSessionComplete,
}: {
    menteeMarked?: boolean;
    mentorMarked?: boolean;
    viewerRole: string;
    otherName: string;
    onMarkComplete: () => Promise<{ success?: boolean } | undefined>;
    onSessionComplete?: () => void;
}) => {
    const [localSaving, setLocalSaving] = useState(false);

    const isMentee = viewerRole === "mentee";
    const iMenteeMarked = menteeMarked;
    const iMentorMarked = mentorMarked;
    const myMark = isMentee ? iMenteeMarked : iMentorMarked;
    const otherMark = isMentee ? iMentorMarked : iMenteeMarked;
    const bothDone = iMenteeMarked && iMentorMarked;

    const handleClick = async () => {
        setLocalSaving(true);
        const result = await onMarkComplete();
        setLocalSaving(false);
        if (result?.success && onSessionComplete) onSessionComplete();
    };

    return (
        <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Completion
            </p>
            <div className="flex flex-col gap-1.5 mb-3">
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold
          ${myMark ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                >
                    <span>{myMark ? "✓" : "○"}</span>
                    <span>
                        {myMark
                            ? "You marked this session complete"
                            : "You haven't marked this session complete yet"}
                    </span>
                </div>
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold
          ${otherMark ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}
                >
                    <span>{otherMark ? "✓" : "○"}</span>
                    <span>
                        {otherMark
                            ? `${otherName} marked this session complete`
                            : `Waiting for ${otherName} to confirm`}
                    </span>
                </div>
            </div>

            {(!myMark || localSaving) && !bothDone && (
                <button
                    onClick={handleClick}
                    disabled={localSaving}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold
            hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
                >
                    {localSaving ? <><Spinner size="sm" light />Marking Complete...</>
                        : (
                            <>
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Mark Session Complete
                            </>
                        )}
                </button>
            )}

            {bothDone && (
                <div
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
          bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold"
                >
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Session Completed by Both Parties
                </div>
            )}
        </div>
    );
};


export default CompletionSection;