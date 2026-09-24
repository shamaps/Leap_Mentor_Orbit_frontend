// src/components/mentee/dashboard/findMentors/ConnectSuccessModal.jsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";

interface ConnectSuccessModalProps {
  mentorName?: string;
  onBackToDashboard: () => void;
}

const ConnectSuccessModal = ({ mentorName, onBackToDashboard }: ConnectSuccessModalProps) => {
  return (
    // Always mounted-open — parent only renders this component once the
    // request has succeeded. Radix Dialog gives us focus trap, ESC-to-close,
    // click-outside-to-close, and portal rendering for free; onOpenChange
    // fires for all three, so we route them to the same "done" handler.
    <Dialog open onOpenChange={(open) => !open && onBackToDashboard()}>
      <DialogContent>
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Text */}
        <div>
          <DialogTitle>Request Sent!</DialogTitle>
          <DialogDescription>
            Your connect request has been sent to{" "}
            <span className="font-semibold text-slate-700">
              {mentorName || "the mentor"}
            </span>
            {". You'll be notified once they respond."}
          </DialogDescription>
        </div>

        {/* Back to dashboard button */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="w-full py-3 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 active:scale-95 transition-all duration-150 shadow-sm shadow-blue-200"
        >
          Back to Dashboard
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectSuccessModal;