// components/common/FormField.jsx
import PropTypes from "prop-types";
const baseFieldClass =
    "w-full text-sm text-slate-800 bg-white border rounded-xl px-3.5 py-2.5 outline-none placeholder:text-slate-400 focus:ring-2 transition-all duration-150 hover:border-slate-400";

const stateClass = (hasError) =>
    hasError
        ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100"
        : "border-slate-300 focus:border-blue-400 focus:ring-blue-100";

const FormField = ({
    label,
    required,
    error,
    as = "input", // "input" | "select" | "textarea"
    icon, // optional leading icon element
    className = "",
    rows = 4,
    children, // <option> elements when as=select
    ...inputProps
}) => {
    const fieldClass = `${baseFieldClass} ${stateClass(!!error)} ${as === "select" ? "appearance-none cursor-pointer pr-8" : ""
        } ${as === "textarea" ? "resize-none" : ""} ${icon ? "pl-10" : ""} ${className}`;

    return (
        <div>
            {label && (
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                    {label} {required && <span className="text-blue-900">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        {icon}
                    </span>
                )}
                {as === "select" ? (
                    <select className={fieldClass} {...inputProps}>
                        {children}
                    </select>
                ) : as === "textarea" ? (
                    <textarea className={fieldClass} rows={rows} {...inputProps} />
                ) : (
                    <input className={fieldClass} {...inputProps} />
                )}
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
};

FormField.propTypes = {
    label: PropTypes.string,
    required: PropTypes.bool,
    error: PropTypes.string,
    as: PropTypes.oneOf(["input", "select", "textarea"]),
    icon: PropTypes.node,
    className: PropTypes.string,
    rows: PropTypes.number,
    children: PropTypes.node,
};

export default FormField;