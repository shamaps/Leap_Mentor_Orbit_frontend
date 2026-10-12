// src/shared/components/FieldShell.tsx
import type { ReactNode } from "react";

export interface FieldChromeProps {
  label?: string;
  required?: boolean;
  error?: string;
  icon?: ReactNode;
  endIcon?: ReactNode;
}

interface FieldShellProps extends FieldChromeProps {
  fieldId: string;
  children: ReactNode;
}

const FieldShell = ({
  label,
  required,
  error,
  icon,
  endIcon,
  fieldId,
  children,
}: FieldShellProps) => (
  <div>
    {label && (
      <label htmlFor={fieldId} className="block text-xs font-semibold text-slate-500 mb-2">
        {label} {required && <span className="text-blue-900">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
      )}
      {children}
      {endIcon && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">{endIcon}</span>
      )}
    </div>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export default FieldShell;
