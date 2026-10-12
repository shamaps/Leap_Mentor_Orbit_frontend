// src/shared/components/fieldStyles.ts
// Visual classes shared by TextField, SelectField and TextAreaField.

const baseFieldClass =
  "w-full text-sm text-slate-800 bg-white border rounded-xl px-3.5 py-2.5 outline-none placeholder:text-slate-400 focus:ring-2 transition-all duration-150 hover:border-slate-400";

const stateClass = (hasError: boolean) =>
  hasError
    ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100"
    : "border-slate-300 focus:border-blue-400 focus:ring-blue-100";

interface FieldClassOptions {
  hasError: boolean;
  hasIcon: boolean;
  extra?: string;
  className?: string;
}

export const buildFieldClass = ({
  hasError,
  hasIcon,
  extra = "",
  className = "",
}: FieldClassOptions): string =>
  [baseFieldClass, stateClass(hasError), extra, hasIcon ? "pl-10" : "", className]
    .filter(Boolean)
    .join(" ");
