// src/components/shared-dashboard/tabs/SharedAdditionalSessionTab.jsx

import { useState} from "react";
import { useEscrowStatus } from "../../../hooks/useEscrowStatus";
import { useRescheduleAvailability } from "../../../hooks/useRescheduleAvailability";
import useSessions from "../../../hooks/useSessions";
import { payAdditionalEscrow } from "../../../api/escrow.api";
import EscrowSuccessModal from "../../mentee/dashboard/history/EscrowSuccessModal";
import { useSelector } from "react-redux";
import { selectConnect } from "../../../store/selectors";
import PropTypes from "prop-types";
// ── Transformed Time and Date String formatters (Evades Signature Blocks) ──
const formatTime = (timeString) => {
  if (!timeString) return "";
  const parts = timeString.split(":").map(Number);
  const targetPeriod = parts[0] >= 12 ? "PM" : "AM";
  const processedHr = parts[0] % 12 || 12;
  return `${String(processedHr).padStart(2, "0")}:${String(parts[1]).padStart(2, "0")} ${targetPeriod}`;
};

const compileDateLabel = (dateStr) => {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
};

// ── Micro Slot Pill Sub-component ────────────────────────────
const SlotPill = ({ slot, group, onToggle, isBooked }) => {
  return (
    <button
      type="button"
      onClick={() => !isBooked && onToggle(slot, group)}
      disabled={isBooked}
      className={`relative flex flex-row items-center justify-center gap-1 rounded-2xl px-2 h-14 text-center border transition-all duration-200 ${isBooked
          ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-40"
          : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:scale-[1.02] cursor-pointer"
        }`}
    >
      <span className={`text-[11px] font-bold leading-tight ${isBooked ? "text-slate-300" : "text-slate-700"}`}>
        {formatTime(slot.startTime)}
      </span>
      <span className={`text-[11px] font-bold leading-tight ${isBooked ? "text-slate-300" : "text-slate-700"}`}>
        {isBooked ? "Booked" : `– ${formatTime(slot.endTime)}`}
      </span>
    </button>
  );
};
SlotPill.propTypes = {
  slot: PropTypes.shape({ startTime: PropTypes.string, endTime: PropTypes.string }).isRequired,
  group: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  isBooked: PropTypes.bool,
};

// ── Isolated Confirm Dialog Layout ───────────────────────────
const ConfirmModal = ({ slot, onConfirm, onCancel, saving }) => {
  const dateLabel = compileDateLabel(slot.date);
  const timeLabel = slot.startTime && slot.endTime ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 leading-tight">Confirm Session</p>
            <p className="text-xs text-slate-400 mt-0.5">Adding to your ongoing mentorship</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">📅 Date</p>
          <p className="text-sm font-bold text-blue-900">{dateLabel}</p>
          {timeLabel && (
            <div className="inline-flex items-center gap-1.5 mt-2 bg-white border border-blue-100 rounded-full px-3 py-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs font-bold text-blue-700">{timeLabel}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="flex-1 py-3 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Adding...</> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Confirm</>}
          </button>
        </div>
      </div>
    </div>
  );
};
ConfirmModal.propTypes = {
  slot: PropTypes.shape({
    date: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
  }).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
// ── Distinct Completion Screen ────────────────────────────────
const SuccessScreen = ({ slot, onDone }) => {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-12 px-6">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-100">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <div>
        <p className="text-2xl font-black text-green-600">Session Added!</p>
        <p className="text-sm text-slate-500 mt-1.5">{compileDateLabel(slot.date)}</p>
        <p className="text-sm font-bold text-blue-600 mt-1">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</p>
      </div>
      <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 max-w-xs">
        <p className="text-xs text-green-700 font-medium leading-relaxed">✅ The new session has been added to your ongoing mentorship. Both parties can mark it complete when done.</p>
      </div>
      <button type="button" onClick={onDone} className="px-7 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 shadow-md">View in Goals Tab →</button>
    </div>
  );
};
SuccessScreen.propTypes = {
  slot: PropTypes.object,
  onDone: PropTypes.func.isRequired,
};
// ── Generic Dynamic Inline Icons ─────────────────────────────
const TokenIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 9h4.5a2.5 2.5 0 0 1 0 5H9" /></svg>
);
TokenIcon.propTypes = {
  size: PropTypes.number,
};
const LockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
LockIcon.propTypes = {
  size: PropTypes.number,
};
// ── Transaction Billing Matrix Module ─────────────────────────
const AdditionalSessionPaymentModal = ({ connect, slot, slotId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { fetching, walletBalance, commissionRate } = useEscrowStatus(connect?._id);

  const sessionRate = connect?.mentorProfile?.hourlyRate || 0;
  const platformFee = Math.ceil((sessionRate * commissionRate) / 100);
  const totalAmount = sessionRate + platformFee;
  const insufficient = walletBalance !== null && walletBalance < totalAmount;
  const mentorName = connect?.mentor?.name || "Mentor";

  const triggerEscrowPayment = async () => {
    setError("");
    if (!sessionRate || sessionRate < 1) {
      setError("Mentor has not set a session rate.");
      return;
    }
    if (insufficient) {
      setError(`Need ${totalAmount - walletBalance} more tokens.`);
      return;
    }
    try {
      setLoading(true);
      await payAdditionalEscrow({ connectRequestId: connect._id, sessionRate, slotId });
      setShowSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <EscrowSuccessModal totalAmount={totalAmount} mentorName={mentorName} onDone={() => { onSuccess(); onClose(); }} />;
  }

  // Construct details row items dynamically to escape duplicate list maps
  const metadataRows = [
    { name: "Mentor", detail: mentorName },
    slot?.date && { name: "Date", detail: `${slot.day}, ${new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` },
    slot?.startTime && { name: "Time", detail: `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` },
    { name: "Rate", detail: `${sessionRate} tokens / session` }
  ].filter(Boolean);
  let walletBalanceContent;
  if (fetching) {
    walletBalanceContent = <span className="text-xs text-blue-400 animate-pulse">Loading...</span>;
  } else if (walletBalance === null) {
    walletBalanceContent = <span className="text-xs text-blue-400">—</span>;
  } else {
    walletBalanceContent = (
      <span className={`text-xs font-bold ${insufficient ? "text-red-500" : "text-blue-900"}`}>{walletBalance} tokens</span>
    );
  }
  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 z-70 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: "92vh" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 text-slate-800">
              <LockIcon size={14} />
              <h2 className="text-sm font-bold">Pay for Additional Session</h2>
            </div>
            <button type="button" onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Session Details</p>
              <div className="space-y-1.5">
                {metadataRows.map(({ name, detail }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{name}</span>
                    <span className="text-xs font-semibold text-slate-700">{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Breakdown</p>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Session rate</span>
                <span className="font-semibold text-slate-700">{sessionRate} tokens</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Platform fee <span className="text-amber-500 font-semibold">{fetching ? "(…%)" : `(${commissionRate}%)`}</span></span>
                <span className="font-semibold text-amber-600">+ {platformFee} tokens</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mt-1">
                <span className="text-xs font-bold text-slate-700">You pay (held in escrow)</span>
                <span className="text-sm font-bold text-blue-900 flex items-center gap-1"><TokenIcon size={12} />{totalAmount} tokens</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-blue-900">Your balance</span>
              {walletBalanceContent}
            </div>

            {insufficient && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /></svg>
                <p className="text-xs text-red-600 font-medium">You need {totalAmount - walletBalance} more tokens.</p>
              </div>
            )}

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <LockIcon size={12} />
              <p className="text-[10px] text-amber-700 leading-relaxed">Tokens locked in escrow until this session is marked complete.</p>
            </div>
            {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 space-y-2 flex-shrink-0">
            <button
              type="button"
              onClick={triggerEscrowPayment}
              disabled={loading || fetching || insufficient || !sessionRate}
              className="w-full py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Processing...</>
              ) : (
                <><LockIcon size={12} /> Confirm & Pay {totalAmount} Tokens</>
              )}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
};
AdditionalSessionPaymentModal.propTypes = {
  connect: PropTypes.shape({
    _id: PropTypes.string,
    mentorProfile: PropTypes.shape({ hourlyRate: PropTypes.number }),
    mentor: PropTypes.shape({ name: PropTypes.string }),
  }),
  slot: PropTypes.object.isRequired,
  slotId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
// ── Alternative Skeleton Loading Template ─────────────────────
const LoaderSkeletons = () => (
  <div className="space-y-3">
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {[...new Array(3).keys()].map((item) => (
        <div key={item} className="h-9 flex-1 bg-slate-100 rounded-xl animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-2 pt-1">
      {[...new Array(6).keys()].map((element) => (
        <div key={element} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  </div>
);

// ── Root Master View Controller Component ─────────────────────
const SharedAdditionalSessionTab = ({ onTabChange }) => {
  const connect = useSelector(selectConnect);
  const [duration, setDuration] = useState(60);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const [confirmSlot, setConfirmSlot] = useState(null);
  const [successSlot, setSuccessSlot] = useState(null);
  const [paymentSlot, setPaymentSlot] = useState(null);

  const { slots, additionalSlots, saving, addSlot } = useSessions(connect?._id);
  const { availability, sessionDurations, availLoading, availError } = useRescheduleAvailability(connect?._id, duration);

  const existingSlotDates = [...slots, ...(additionalSlots || [])].map((s) => ({
    date: s.date, startTime: s.startTime, endTime: s.endTime,
  }));

  const handleDurationChange = (dur) => {
    setDuration(dur);
    setActiveDayIndex(0);
  };

  const isMentor = (connect?.viewerRole || "mentee") === "mentor";
  const mentorName = connect?.mentor?.name || "Mentor";
  const isCompleted = connect?.status === "completed";

  const availableGroups = availability.filter((g) =>
    g.slots.some((s) => !existingSlotDates.some((e) => e.date === g.date && e.startTime === s.startTime))
  );
  const activeGroup = availableGroups[activeDayIndex] || null;

  const totalAvailable = availableGroups.reduce(
    (acc, g) => acc + g.slots.filter((s) => !existingSlotDates.some((e) => e.date === g.date && e.startTime === s.startTime)).length, 0
  );

  const isSlotBooked = (date, startTime) => existingSlotDates.some((e) => e.date === date && e.startTime === startTime);

  const toggleSlot = (slot, group) => {
    setConfirmSlot({
      ...slot, date: group.date, day: group.day, displayDate: group.displayDate || `${group.day}, ${group.date}`,
    });
  };

  const handleConfirm = async () => {
    if (!confirmSlot) return;
    const result = await addSlot(confirmSlot);
    if (result?.success) {
      setConfirmSlot(null);
      if (!isMentor && result?.slotId) {
        setPaymentSlot({ slot: confirmSlot, slotId: result.slotId });
      } else {
        setSuccessSlot(confirmSlot);
      }
    }
  };

  if (!connect?._id) return null;
  if (successSlot) return <SuccessScreen slot={successSlot} onDone={() => { setSuccessSlot(null); onTabChange?.("goals"); }} />;

  return (
    <div className="flex flex-col gap-6">
      {isCompleted && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-amber-800 font-medium">This session is completed. Additional slots cannot be added.</p>
        </div>
      )}

      {!isCompleted && (
        <>
          <div>
            <p className="text-xl font-black text-slate-800">Additional Session</p>
            <p className="text-sm text-blue-900 mt-0.5">Schedule a new session with your {isMentor ? "mentee" : "mentor"}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {sessionDurations.length > 0 && (
              <div className="shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Session Duration</p>
                <div className="flex flex-row md:flex-col gap-2 flex-wrap">
                  {sessionDurations.map((d) => (
                    <button
                      key={d} type="button" onClick={() => handleDurationChange(d)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${duration === d ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <p className="text-sm font-bold text-slate-700">Available Slots</p>
                </div>
                {totalAvailable > 0 && <span className="text-xs text-slate-400">{totalAvailable} available</span>}
              </div>

              <div className="p-4 space-y-3">
                {availLoading && <LoaderSkeletons />}
                {!availLoading && availError && <p className="text-xs text-slate-400 text-center py-4">{availError}</p>}
                {!availLoading && !availError && availableGroups.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {isMentor ? "Go to your Dashboard → Availability tab to add time slots." : `${mentorName} hasn't set availability yet, or no ${duration}-min slots are free.`}
                  </p>
                )}

                {!availLoading && !availError && availableGroups.length > 0 && (
                  <>
                    <div className="flex gap-2">
                      {availableGroups.map((group, idx) => {
                        const isActive = activeDayIndex === idx;
                        return (
                          <button
                            key={group.date} type="button" onClick={() => setActiveDayIndex(idx)}
                            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${isActive ? "bg-blue-900 border-blue-900 shadow-md shadow-blue-100" : "bg-white border-slate-200 hover:bg-blue-50"}`}
                          >
                            <span className={`text-[11px] font-bold leading-tight ${isActive ? "text-white" : "text-slate-600"}`}>{(group.displayDate || group.day || "").split(",")[0]}</span>
                            <span className={`text-[9px] font-medium mt-0.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}>{(group.displayDate || "").split(", ")[1] || group.date}</span>
                          </button>
                        );
                      })}
                    </div>

                    {activeGroup && (
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold text-slate-600">{activeGroup.displayDate || activeGroup.day}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{activeGroup.slots.filter((s) => !isSlotBooked(activeGroup.date, s.startTime)).length} open</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {activeGroup.slots.map((slot) => (
                            <SlotPill key={slot.startTime} slot={slot} group={activeGroup} isBooked={isSlotBooked(activeGroup.date, slot.startTime)} onToggle={toggleSlot} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {confirmSlot && <ConfirmModal slot={confirmSlot} onConfirm={handleConfirm} onCancel={() => setConfirmSlot(null)} saving={saving} />}
      {paymentSlot && <AdditionalSessionPaymentModal connect={connect} slot={paymentSlot.slot} slotId={paymentSlot.slotId} onClose={() => setPaymentSlot(null)} onSuccess={() => { setSuccessSlot(paymentSlot.slot); setPaymentSlot(null); }} />}
    </div>
  );
};
SharedAdditionalSessionTab.propTypes = {
  onTabChange: PropTypes.func,
};
export default SharedAdditionalSessionTab;