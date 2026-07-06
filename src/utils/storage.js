// src/utils/storage.js
const isBrowser = typeof window !== "undefined";
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
    get: (key) => safeGet(window.sessionStorage, key),
    set: (key, value) => safeSet(window.sessionStorage, key, value),
    remove: (key) => safeRemove(window.sessionStorage, key),
    clear: () => isBrowser && window.sessionStorage.clear(),
    getJSON: (key) => {
        const raw = safeGet(window.sessionStorage, key);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },
    setJSON: (key, value) => safeSet(window.sessionStorage, key, JSON.stringify(value)),
};

export const localStore = {
    get: (key) => safeGet(window.localStorage, key),
    set: (key, value) => safeSet(window.localStorage, key, value),
    remove: (key) => safeRemove(window.localStorage, key),
    clear: () => isBrowser && window.localStorage.clear(),
    keys: () => (isBrowser ? Object.keys(window.localStorage) : []),
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