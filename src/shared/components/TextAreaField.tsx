// src/shared/components/TextAreaField.tsx
import { forwardRef, useId, type ComponentPropsWithoutRef } from "react";
import FieldShell, { type FieldChromeProps } from "./FieldShell";
import { buildFieldClass } from "./fieldStyles";

export interface TextAreaFieldProps
  extends ComponentPropsWithoutRef<"textarea">,
    FieldChromeProps {}

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    { label, required, error, icon, endIcon, className = "", rows = 4, id, name, ...textareaProps },
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
        <textarea
          ref={ref}
          id={fieldId}
          name={name}
          rows={rows}
          className={buildFieldClass({
            hasError: !!error,
            hasIcon: !!icon,
            extra: "resize-none",
            className,
          })}
          {...textareaProps}
        />
      </FieldShell>
    );
  },
);

TextAreaField.displayName = "TextAreaField";

export default TextAreaField;
