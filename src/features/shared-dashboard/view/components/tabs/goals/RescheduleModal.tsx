import { useState } from "react";
import Spinner from "@/shared/components/Spinner";
import { useRescheduleAvailability } from "@/features/mentor/presenter/useRescheduleAvailability";
import SlotTabPicker from "./SlotTabPicker";
import {
    type BookedSlot,
    type NewSlotSelection,
    formatTime,
    isActive,
} from "./sessionCard.utils";

const RescheduleModal = ({
    slotIndex,
    connectRequestId,
    existingSlots,
    onConfirm,
    onClose,
    saving,
}: {
    slotIndex: number;
    connectRequestId: string;
    existingSlots: BookedSlot[];
    onConfirm: (newSlot: NewSlotSelection) => void;
    onClose: () => void;
    saving?: boolean;
}) => {
    const [duration, setDuration] = useState(60);
    const [selectedNewSlot, setSelectedNewSlot] = useState<NewSlotSelection | null>(null);

    const { availability, sessionDurations, availLoading, availError } =
        useRescheduleAvailability(connectRequestId, duration);

    const bookedSlots = existingSlots
        .filter((s: BookedSlot, i: number) => i !== slotIndex && isActive(s))
        .map((s: BookedSlot) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime }));

    let availabilityContent;
    if (availLoading) {
        availabilityContent = (
            <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-16 rounded-2xl bg-slate-100 animate-pulse"
                    />
                ))}
            </div>
        );
    } else if (availError) {
        availabilityContent = (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {availError}
            </div>
        );
    } else if (availability.length === 0) {
        availabilityContent = (
            <div className="flex flex-col items-center gap-3 py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p className="text-sm font-semibold text-slate-600">
                    No slots available
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                    Your mentor hasn&apos;t set availability for {duration}-min
                    sessions yet.
                </p>
            </div>
        );
    } else {
        availabilityContent = (
            <SlotTabPicker
                availability={availability}
                selectedSlot={selectedNewSlot}
                onSelect={setSelectedNewSlot}
                bookedSlots={bookedSlots}
            />
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">
                                Reschedule Session
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                    <div className="flex items-start gap-2.5 px-3.5 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 mt-0.5"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-xs text-blue-900 font-medium leading-relaxed">
                            The current slot will be cancelled and replaced with the new one
                            you pick below. Your mentor will be notified immediately.
                        </p>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Session Duration
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {sessionDurations.map((dur) => (
                                <button
                                    key={dur}
                                    type="button"
                                    onClick={() => {
                                        setDuration(dur);
                                        setSelectedNewSlot(null);
                                    }}
                                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all
                    ${duration === dur
                                            ? "bg-blue-900 text-white shadow-md"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {dur} min
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        {availabilityContent}
                    </div>
                </div>

                {selectedNewSlot && (
                    <div className="border-t border-slate-100 px-6 py-4 shrink-0">
                        <div className="flex items-center justify-between gap-3 mb-3 px-3.5 py-3 border border-slate-200 rounded-xl">
                            <div>
                                <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">
                                    New Slot
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {new Date(
                                        selectedNewSlot.date + "T00:00:00",
                                    ).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="text-xs font-semibold text-slate-900">
                                    {formatTime(selectedNewSlot.startTime)} –{" "}
                                    {formatTime(selectedNewSlot.endTime)}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-sm
                  font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onConfirm(selectedNewSlot)}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 bg-blue-900"
                            >
                                {saving ? <><Spinner size="sm" light />Rescheduling...</>
                                    : (
                                        <>
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
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Confirm Reschedule
                                        </>
                                    )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default RescheduleModal;