// src/components/common/ErrorState.jsx
import PropTypes from "prop-types";

const ErrorState = ({
    message,
    subMessage,
    actionLabel = "Retry",
    onAction,
    fullWidth = false,
    compact = false,
}) => (
    <div className={`${fullWidth ? "col-span-1 md:col-span-2 lg:col-span-3 " : ""}flex flex-col items-center justify-center ${compact ? "py-8" : "py-16"} text-center space-y-4`}>
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100
      flex items-center justify-center text-red-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        </div>
        <div className="space-y-1">
            <p className="text-sm font-medium text-red-500">{message}</p>
            {subMessage && (
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{subMessage}</p>
            )}
        </div>
        {onAction && (
            <button
                type="button"
                onClick={onAction}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold
          hover:bg-blue-700 transition-all"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

ErrorState.propTypes = {
    message: PropTypes.string.isRequired,
    subMessage: PropTypes.string,
    actionLabel: PropTypes.string,
    onAction: PropTypes.func,
    fullWidth: PropTypes.bool,
    compact: PropTypes.bool,
};

export default ErrorState;