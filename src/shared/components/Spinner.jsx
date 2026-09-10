import PropTypes from "prop-types";

const SIZE_MAP = {
    xs: "w-3 h-3 border-2",
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[3px]",
    lg: "w-9 h-9 border-4",
};

const Spinner = ({ size = "sm", light = false, label }) => (
    <span className="inline-flex items-center gap-2">
        <span
            className={`${SIZE_MAP[size]} rounded-full border-t-transparent animate-spin ${light ? "border-white" : "border-blue-600"
                }`}
        />
        {label && <span className="text-xs text-slate-500">{label}</span>}
    </span>
);

Spinner.propTypes = {
    size: PropTypes.oneOf(["xs", "sm", "md", "lg"]),
    light: PropTypes.bool,
    label: PropTypes.string,
};

export default Spinner;