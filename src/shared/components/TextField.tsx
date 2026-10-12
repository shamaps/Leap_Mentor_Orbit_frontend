// src/shared/components/TextField.tsx
import { forwardRef, useId, type ComponentPropsWithoutRef } from "react";
import FieldShell, { type FieldChromeProps } from "./FieldShell";
import { buildFieldClass } from "./fieldStyles";

export interface TextFieldProps
  extends ComponentPropsWithoutRef<"input">,
    FieldChromeProps {}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, required, error, icon, endIcon, className = "", id, name, ...inputProps }, ref) => {
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
        <input
          ref={ref}
          id={fieldId}
          name={name}
          className={buildFieldClass({ hasError: !!error, hasIcon: !!icon, className })}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
