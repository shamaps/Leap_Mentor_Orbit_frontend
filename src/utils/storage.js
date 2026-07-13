// src/utils/storage.js
const isBrowser = globalThis.window !== undefined;
const SSO_TTL_MS = 10 * 60 * 1000; // 10 minutes

const safeGet = (store, key) => {
    if (!isBrowser) return null;
    try {
        return store.getItem(key);
    } catch {
        return null;
    }
};

const safeSet = (store, key, value) => {
    if (!isBrowser) return false;
    try {
        store.setItem(key, value);
        return true;
    } catch {
        return false;
    }
};

const safeRemove = (store, key) => {
    if (!isBrowser) return;
    try {
        store.removeItem(key);
    } catch {
        /* no-op */
    }
};

export const sessionStore = {
    get: (key) => safeGet(globalThis.sessionStorage, key),
    set: (key, value) => safeSet(globalThis.sessionStorage, key, value),
    remove: (key) => safeRemove(globalThis.sessionStorage, key),
    clear: () => isBrowser && globalThis.sessionStorage.clear(),
    getJSON: (key) => {
        const raw = safeGet(globalThis.sessionStorage, key);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },
    setJSON: (key, value) => safeSet(globalThis.sessionStorage, key, JSON.stringify(value)),
};

export const localStore = {
    get: (key) => safeGet(globalThis.localStorage, key),
    set: (key, value) => safeSet(globalThis.localStorage, key, value),
    remove: (key) => safeRemove(globalThis.localStorage, key),
    clear: () => isBrowser && globalThis.localStorage.clear(),
    keys: () => (isBrowser ? Object.keys(globalThis.localStorage) : []),
};

// ── SSO flow flags — short-lived, TTL-bound, sessionStorage only ──
export const ssoFlags = {
    set(role, termsAccepted = true) {
        sessionStore.set(
            "sso_flow",
            JSON.stringify({ role, termsAccepted, ts: Date.now() }),
        );
    },
    get() {
        const raw = sessionStore.get("sso_flow");
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.ts > SSO_TTL_MS) {
                sessionStore.remove("sso_flow");
                return null;
            }
            return parsed;
        } catch {
            sessionStore.remove("sso_flow");
            return null;
        }
    },
    clear() {
        sessionStore.remove("sso_flow");
    },
};