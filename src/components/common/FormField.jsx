// components/common/FormField.jsx
import PropTypes from "prop-types";
import { forwardRef, useId } from "react";
const baseFieldClass =
    "w-full text-sm text-slate-800 bg-white border rounded-xl px-3.5 py-2.5 outline-none placeholder:text-slate-400 focus:ring-2 transition-all duration-150 hover:border-slate-400";

const stateClass = (hasError) =>
    hasError
        ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100"
        : "border-slate-300 focus:border-blue-400 focus:ring-blue-100";

const FormField = forwardRef(
    (
        {
            label,
            required,
            error,
            as = "input",
            icon,
            endIcon,
            className = "",
            rows = 4,
            children,
            id,
            name,
            ...inputProps
        },
        ref
    ) => {
        const generatedId = useId();
        const fieldId = id || name || generatedId;

        const fieldClass = `${baseFieldClass} ${stateClass(!!error)} ${as === "select" ? "appearance-none cursor-pointer pr-8" : ""
            } ${as === "textarea" ? "resize-none" : ""} ${icon ? "pl-10" : ""} ${className}`;
        let fieldElement;
        if (as === "select") {
            fieldElement = (
                <select ref={ref} id={fieldId} name={name} className={fieldClass} {...inputProps}>
                    {children}
                </select>
            );
        } else if (as === "textarea") {
            fieldElement = <textarea ref={ref} id={fieldId} name={name} className={fieldClass} rows={rows} {...inputProps} />;
        } else {
            fieldElement = <input ref={ref} id={fieldId} name={name} className={fieldClass} {...inputProps} />;
        }
        return (
            <div>
                {label && (
                    <label htmlFor={fieldId} className="block text-xs font-semibold text-slate-500 mb-2">
                        {label} {required && <span className="text-blue-900">*</span>}
                    </label>
                )}                <div className="relative">
                    {icon && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                            {icon}
                        </span>
                    )}
                    {fieldElement}
                    {endIcon && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2">
                            {endIcon}
                        </span>
                    )}
                </div>
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
        );
    }
);

FormField.displayName = "FormField";

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