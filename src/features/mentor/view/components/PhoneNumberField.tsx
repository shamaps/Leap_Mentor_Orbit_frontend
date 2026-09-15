// components/mentor/verification/PhoneNumberField.jsx
import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneNumberFieldProps {
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  error?: string;
}

const PhoneNumberField = ({ value, onChange, error }: PhoneNumberFieldProps) => {
  const [touched, setTouched] = useState(false);

  const isValid = value && isValidPhoneNumber(value);
  const showError = touched && value && !isValid;
  const showSuccess = touched && isValid;

  const handleChange = (val?: string) => {
    onChange({ target: { name: "phoneNumber", value: val || "" } });
  };
  let phoneFieldStateClass = "border-slate-300 hover:border-slate-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100";
  if (showError || error) {
    phoneFieldStateClass = "border-red-300 ring-2 ring-red-100";
  } else if (showSuccess) {
    phoneFieldStateClass = "border-green-400 ring-2 ring-green-100";
  }
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50">
        <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.42 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Contact Information
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Used for verification purposes only
          </p>
        </div>
      </div>

      <div className="px-6 py-5">
        <label htmlFor="phone-number-input" className="block text-xs font-semibold text-slate-500 mb-2">
          Phone Number <span className="text-red-400">*</span>
        </label>

        <div
          className={`flex items-center border rounded-xl overflow-hidden transition-all duration-150 ${phoneFieldStateClass}`}
        >
          <PhoneInput
            id="phone-number-input"
            international
            defaultCountry="IN"
            value={value}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            className="w-full phone-input-wrapper"
          />

          {/* Validation icon */}
          {touched && value && (
            <div className="pr-3 shrink-0">
              {isValid ? (
                <svg
                  className="text-green-500"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  className="text-red-400"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Error messages */}
        {(showError || error) && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {error || "Please enter a valid phone number"}
          </p>
        )}
        {showSuccess && (
          <p className="text-xs text-green-500 mt-1.5 flex items-center gap-1">
            ✓ Valid phone number
          </p>
        )}
        {!touched && (
          <p className="text-xs text-slate-400 mt-1.5">
            Select your country code and enter your number
          </p>
        )}
      </div>

      {/* Override styles for the PhoneInput internals */}
      <style>{`
        .phone-input-wrapper {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0 12px;
          gap: 8px;
        }
        .phone-input-wrapper .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 4px;
          border-right: 1px solid #e2e8f0;
          padding-right: 10px;
          margin-right: 2px;
        }
        .phone-input-wrapper .PhoneInputCountrySelect {
          opacity: 0;
          position: absolute;
          width: 36px;
          height: 28px;
          cursor: pointer;
        }
        .phone-input-wrapper .PhoneInputCountryIcon {
          width: 22px;
          height: 16px;
          border-radius: 2px;
          overflow: hidden;
        }
        .phone-input-wrapper .PhoneInputCountrySelectArrow {
          width: 6px;
          height: 6px;
          border-right: 1.5px solid #94a3b8;
          border-bottom: 1.5px solid #94a3b8;
          transform: rotate(45deg) translateY(-2px);
          margin-left: 2px;
        }
        .phone-input-wrapper .PhoneInputInput {
          flex: 1;
          padding: 10px 0;
          font-size: 0.875rem;
          color: #1e293b;
          outline: none;
          background: transparent;
          min-width: 0;
        }
        .phone-input-wrapper .PhoneInputInput::placeholder {
          color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default PhoneNumberField;