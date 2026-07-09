// src/utils/mapServerErrorsToForm.js
//
// Maps a backend error response onto react-hook-form's setError, so
// server-side validation failures show up inline next to the specific
// field, the same way client-side Zod errors already do.
//
// This closes the gap flagged in the code quality audit: server errors
// were previously only ever shown as one generic banner/toast message,
// never attached to the field that actually caused them.
//
// Supports two backend response shapes:
//   1. Field-specific:  { errors: { email: "Email already in use" } }
//   2. Generic message: { message: "Invalid email or password." }
//
// Usage:
//   try {
//     await someApiCall(data);
//   } catch (err) {
//     mapServerErrorsToForm(err, setError, { fallbackField: "root" });
//   }

export function mapServerErrorsToForm(err, setError, { fallbackField = "root" } = {}) {
    const responseData = err?.response?.data;

    // Shape 1: backend returned per-field validation errors.
    if (responseData?.errors && typeof responseData.errors === "object") {
        let mapped = false;
        Object.entries(responseData.errors).forEach(([field, message]) => {
            if (!message) return;
            setError(field, {
                type: "server",
                message: Array.isArray(message) ? message[0] : String(message),
            });
            mapped = true;
        });
        if (mapped) return;
    }

    // Shape 2: fall back to a single generic message, attached to a
    // named field (e.g. "password" for invalid-credentials cases) or to
    // react-hook-form's special "root" key, which FormField-based forms
    // can render as a top-of-form banner.
    const message =
        responseData?.message || err?.message || "Something went wrong. Please try again.";

    setError(fallbackField, { type: "server", message });
}

export default mapServerErrorsToForm;