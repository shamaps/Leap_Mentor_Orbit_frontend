// src/components/mentee/dashboard/history/EscrowSuccessModal.jsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/shared/components/ui/dialog";

const LockIcon = ({ size = 14 }) => (
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

const CheckIcon = () => (
  <svg
    width="40"
    height="40"
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
);

// ── Props ─────────────────────────────────────────────────────
// totalAmount  — tokens locked
// mentorName   — mentor's name
// onDone       — called when user clicks Done or X (patches parent + closes)
interface EscrowSuccessModalProps {
  totalAmount: number;
  mentorName: string;
  onDone: () => void;
}


           

const EscrowSuccessModal = ({ totalAmount, mentorName, onDone }: EscrowSuccessModalProps) => {
  return (
    // Always mounted-open — parent only renders this once payment has
    // succeeded. Radix Dialog gives us focus trap, ESC-to-close,
    // click-outside-to-close, and portal rendering for free; onOpenChange
    // fires for all of those, so we route them to the same "done" handler.
    <Dialog open onOpenChange={(open) => !open && onDone()}>
      <DialogContent className="p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <LockIcon size={15} />
            <DialogTitle className="text-sm font-bold">Payment Successful</DialogTitle>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label="Close"
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
          </DialogClose>
        </div>

        {/* Body */}
        <div className="w-full px-5 py-8 flex flex-col items-center text-center gap-4">
          {/* Check icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500">
            <CheckIcon />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">
              {totalAmount} tokens locked in escrow
            </p>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed mt-0">
              Your session with{" "}
              <span className="font-semibold text-slate-700">{mentorName}</span>{" "}
              is now confirmed. Tokens will be released to them only after you
              mark the session as complete.
            </DialogDescription>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 text-xs font-semibold text-blue-900">
            <LockIcon size={11} />
            Secured in Escrow
          </div>
          {/* Done button */}
          <button
            type="button"
            onClick={onDone}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all mt-2"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default EscrowSuccessModal;