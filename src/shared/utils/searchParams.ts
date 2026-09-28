export type ParamUpdates = Record<string, string | number | undefined>;

/**
 * Returns a copy of `base` with `updates` applied:
 * - `undefined` leaves the param untouched
 * - `""` removes the param
 * - anything else sets it
 */
export const applyParamUpdates = (
    base: URLSearchParams,
    updates: ParamUpdates,
): URLSearchParams => {
    const params = new URLSearchParams(base);

    for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;
        if (value === "") params.delete(key);
        else params.set(key, String(value));
    }

    return params;
};