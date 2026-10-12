// src/shared/components/SelectField.tsx
import { forwardRef, useId, type ComponentPropsWithoutRef } from "react";
import FieldShell, { type FieldChromeProps } from "./FieldShell";
import { buildFieldClass } from "./fieldStyles";

export interface SelectFieldProps
  extends ComponentPropsWithoutRef<"select">,
    FieldChromeProps {}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    { label, required, error, icon, endIcon, className = "", id, name, children, ...selectProps },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id || name || generatedId;

    return (
      <FieldShell
        label={label}
        required={required}
        error={error}
        icon={icon}
        endIcon={endIcon}
        fieldId={fieldId}
      >
        <select
          ref={ref}
          id={fieldId}
          name={name}
          className={buildFieldClass({
            hasError: !!error,
            hasIcon: !!icon,
            extra: "appearance-none cursor-pointer pr-8",
            className,
          })}
          {...selectProps}
        >
          {children}
        </select>
      </FieldShell>
    );
  },
);

SelectField.displayName = "SelectField";

export default SelectField;
