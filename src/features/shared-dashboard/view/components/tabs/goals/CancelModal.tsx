import { useState } from "react";
import Spinner from "@/shared/components/Spinner";
import { type SessionTime, formatSlotDate, formatTime } from "./sessionCard.utils";

const CancelModal = ({
    slot,
    onConfirm,
    onClose,
    saving,
}: {
    slot?: SessionTime | null;
    onConfirm: (reason: string) => void;
    onClose: () => void;
    saving?: boolean;
}) => {
    const [reason, setReason] = useState("");

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-base font-bold text-slate-800">
                            Cancel this session?
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {formatSlotDate(slot)} &bull; {formatTime(slot?.startTime)} –{" "}
                            {formatTime(slot?.endTime)}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                    This session slot will be permanently cancelled. The other party will
                    be notified immediately.
                </p>

                <div>
                    <label htmlFor="cancel-reason" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Reason <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <textarea
                        id="cancel-reason"
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Schedule conflict, emergency..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700
              bg-white outline-none focus:border-red-300 transition-colors placeholder:text-slate-400
              resize-none"
                    />
                </div>

                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-sm
              font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Keep Session
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold
              hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
                    >
                        {saving ? <><Spinner size="sm" light />Cancelling...</>
                            : (
                                "Yes, Cancel It"
                            )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelModal;