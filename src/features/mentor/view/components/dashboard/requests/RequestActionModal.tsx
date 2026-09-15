// src/components/mentor/dashboard/requests/RequestActionModal.jsx
const RequestActionModal = ({
  type,
  menteeName,
  onBack,
}: {
  type: string;
  menteeName?: string;
  onBack: () => void;
}) => {
  const isAccepted = type === "accepted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${isAccepted ? "bg-emerald-50" : "bg-red-50"
            }`}
        >
          {isAccepted ? (
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl font-extrabold mb-2 ${isAccepted ? "text-emerald-600" : "text-red-500"
            }`}
        >
          {isAccepted ? "Request Accepted!" : "Request Rejected"}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-slate-500 leading-relaxed mb-2">
          {isAccepted ? (
            <>
              You have accepted{" "}
              <span className="font-semibold text-slate-700">
                {menteeName}&apos;s
              </span>{" "}
              mentorship request.
            </>
          ) : (
            <>
              You have rejected{" "}
              <span className="font-semibold text-slate-700">
                {menteeName}&apos;s
              </span>{" "}
              mentorship request.
            </>
          )}
        </p>

        {/* Extra note for accept */}
        {isAccepted && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6 mt-1">
            <p className="text-xs text-blue-600 font-medium leading-relaxed">
              📅 A calendar invite has been sent to both you and {menteeName}.
            </p>
          </div>
        )}

        {!isAccepted && <div className="mb-6" />}

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-all duration-150"
        >
          Back to Requests
        </button>
      </div>
    </div>
  );
};

export default RequestActionModal;