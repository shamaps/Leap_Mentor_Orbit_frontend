// src/components/common/EmptyState.jsx
import PropTypes from "prop-types";

const EmptyState = ({
    icon,
    message,
    subMessage,
    actionLabel,
    onAction,
    fullWidth = false,
    compact = false,
}) => (
    <div className={`${fullWidth ? "col-span-1 md:col-span-2 lg:col-span-3 " : ""}flex flex-col items-center justify-center ${compact ? "py-8" : "py-20"} text-center space-y-4`}>
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200
      flex items-center justify-center text-slate-300">
            {icon || (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )}
        </div>
        <div className="space-y-1">
            <p className="text-sm font-bold text-slate-700">{message}</p>
            {subMessage && (
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{subMessage}</p>
            )}
        </div>
        {actionLabel && onAction && (
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

EmptyState.propTypes = {
    icon: PropTypes.node,
    message: PropTypes.string.isRequired,
    subMessage: PropTypes.string,
    actionLabel: PropTypes.string,
    onAction: PropTypes.func,
    fullWidth: PropTypes.bool,
    compact: PropTypes.bool,
};

export default EmptyState;