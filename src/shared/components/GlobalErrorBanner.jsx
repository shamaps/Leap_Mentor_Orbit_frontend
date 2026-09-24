// src/components/common/GlobalErrorBanner.jsx
import { useSelector, useDispatch } from "react-redux";
import { selectGlobalError } from "../../app/store/selectors";
import { clearGlobalError } from "../../app/store/slices/uiSlice";

const GlobalErrorBanner = () => {
    const globalError = useSelector(selectGlobalError);
    const dispatch = useDispatch();

    if (!globalError) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3">
            <span>{globalError.message}</span>
            <button
                onClick={() => dispatch(clearGlobalError())}
                className="text-red-400 hover:text-red-600 font-bold"
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
};

export default GlobalErrorBanner;