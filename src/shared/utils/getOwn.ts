/**
 * Look a key up in a config map, ignoring inherited properties.
 * A plain `map[key]` would return Object.prototype members for keys such as
 * "constructor" or "toString", which then bypass `??` / `||` fallbacks.
 */
export const getOwn = <T>(
    map: Readonly<Record<string, T>>,
    key: string,
): T | undefined =>
    Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;