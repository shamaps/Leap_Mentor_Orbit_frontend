// src/components/mentee/dashboard/history/EscrowPaymentModal.jsx
import { useState, useEffect } from "react";
import { payEscrow, getEscrowStatus } from "@/features/shared-dashboard/model/escrow.api";
import { formatTime } from "./constants";
import PropTypes from "prop-types";
import EscrowSuccessModal from "./EscrowSuccessModal";
import logger from "@/shared/utils/logger";
const TokenIcon = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9h4.5a2.5 2.5 0 0 1 0 5H9" />
  </svg>
);
TokenIcon.propTypes = {
  size: PropTypes.number,
};
const LockIcon = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
LockIcon.propTypes = {
  size: PropTypes.number,
};
const EscrowPaymentModal = ({ request, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);
  const [commissionRate, setCommissionRate] = useState(20);
  const [successPatch, setSuccessPatch] = useState(null);

  const sessionCount = request?.selectedSlots?.length || 1;
  const sessionRate = request?.mentorProfile?.hourlyRate || 0;
  const mentorAmount = sessionRate * sessionCount;
  const platformFee = Math.ceil((mentorAmount * commissionRate) / 100);
  const totalAmount = mentorAmount + platformFee;
  const insufficient = walletBalance !== null && walletBalance < totalAmount;
  const mentorName = request?.mentor?.name || "Mentor";
  const confirmedSlot = request?.confirmedSlot;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setFetching(true);
        const data = await getEscrowStatus(request._id);
        setWalletBalance(data?.wallet?.balance ?? null);
        if (data?.commissionRate != null)
          setCommissionRate(data.commissionRate);
      } catch (err) {
        logger.warn("Could not fetch escrow status", {
          detail: err?.response?.data || err.message,
        });
      } finally {
        setFetching(false);
      }
    };
    if (request?._id) fetchStatus();
  }, [request?._id]);

  const handlePay = async () => {
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
      await payEscrow({
        connectRequestId: request._id,
        sessionRate,
        sessionCount,
      });
      setSuccessPatch({
        status: "ongoing",
        paymentStatus: "paid",
        sessionRate,
        sessionCount,
        totalAmount,
        commissionRate,
        commissionAmount: platformFee,
        mentorPayout: mentorAmount,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message || "Payment failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (successPatch) {
    return (
      <EscrowSuccessModal
        totalAmount={totalAmount}
        mentorName={mentorName}
        onDone={() => {
          onSuccess(successPatch);
          onClose();
        }}
      />
    );
  }
  let walletBalanceContent;
  if (fetching) {
    walletBalanceContent = (
      <span className="text-xs text-blue-400 animate-pulse">Loading...</span>
    );
  } else if (walletBalance === null) {
    walletBalanceContent = <span className="text-xs text-blue-400">—</span>;
  } else {
    walletBalanceContent = (
      <span
        className={`text-xs font-bold ${insufficient ? "text-red-500" : "text-blue-900"}`}
      >
        {walletBalance} tokens
      </span>
    );
  }
  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 z-70 flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: "92vh" }}
        >
          {/* ── Header ────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 text-slate-800">
              <LockIcon size={14} />
              <h2 className="text-sm font-bold">Escrow Payment</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748B"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable body ────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
            {/* Session info — compact single card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Session Details
              </p>
              <div className="space-y-1.5">
                {[
                  { label: "Mentor", value: mentorName },
                  confirmedSlot && {
                    label: "Date",
                    value: `${confirmedSlot.day}, ${new Date(
                      confirmedSlot.date + "T00:00:00",
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`,
                  },
                  confirmedSlot && {
                    label: "Time",
                    value: `${formatTime(confirmedSlot.startTime)} – ${formatTime(confirmedSlot.endTime)}`,
                  },
                  { label: "Rate", value: `${sessionRate} tokens / session` },
                  {
                    label: "Sessions",
                    value: `${sessionCount} session${sessionCount > 1 ? "s" : ""} (auto-filled)`,
                  },
                ]
                  .filter(Boolean)
                  .map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-slate-400">{label}</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Payment Breakdown
              </p>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  {sessionRate} × {sessionCount} session
                  {sessionCount > 1 ? "s" : ""}
                </span>
                <span className="font-semibold text-slate-700">
                  {mentorAmount} tokens
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Platform fee{" "}
                  <span className="text-amber-500 font-semibold">
                    {fetching ? "(…%)" : `(${commissionRate}%)`}
                  </span>
                </span>
                <span className="font-semibold text-amber-600">
                  + {platformFee} tokens
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mentor receives</span>
                <span className="font-semibold text-emerald-600">
                  {mentorAmount} tokens
                </span>
              </div>

              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mt-1">
                <span className="text-xs font-bold text-slate-700">
                  You pay (held in escrow)
                </span>
                <span className="text-sm font-bold text-blue-900 flex items-center gap-1">
                  <TokenIcon size={12} />
                  {totalAmount} tokens
                </span>
              </div>
            </div>

            {/* Balance row */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-blue-900">
                Your balance
              </span>
              {walletBalanceContent}
            </div>

            {/* Insufficient warning */}
            {insufficient && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-xs text-red-600 font-medium">
                  You need {totalAmount - walletBalance} more tokens.
                </p>
              </div>
            )}

            {/* Escrow note — condensed */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <LockIcon size={12} />
              <p className="text-[10px] text-amber-700 leading-relaxed">
                Tokens locked in escrow. Platform fee collected only on
                completion. Full refund if cancelled.
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-500 font-medium text-center">
                {error}
              </p>
            )}
          </div>

          {/* ── Footer buttons — always visible ───────────── */}
          <div className="px-4 py-3 border-t border-slate-100 space-y-2 flex-shrink-0">
            <button
              type="button"
              onClick={handlePay}
              disabled={loading || fetching || insufficient || !sessionRate}
              className="w-full py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold
                hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <LockIcon size={12} /> Confirm & Pay {totalAmount} Tokens
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full py-2 rounded-xl border border-slate-200 text-slate-600
                text-xs font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
EscrowPaymentModal.propTypes = {
  request: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    selectedSlots: PropTypes.array,
    mentorProfile: PropTypes.shape({ hourlyRate: PropTypes.number }),
    mentor: PropTypes.shape({ name: PropTypes.string }),
    confirmedSlot: PropTypes.shape({
      day: PropTypes.string,
      date: PropTypes.string,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default EscrowPaymentModal;
