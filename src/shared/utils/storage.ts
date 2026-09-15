// src/utils/storage.ts
const isBrowser = globalThis.window !== undefined;
const SSO_TTL_MS = 10 * 60 * 1000; // 10 minutes

const safeGet = (store: Storage, key: string): string | null => {
    if (!isBrowser) return null;
    try {
        return store.getItem(key);
    } catch {
        return null;
    }
};

const safeSet = (store: Storage, key: string, value: string): boolean => {
    if (!isBrowser) return false;
    try {
        store.setItem(key, value);
        return true;
    } catch {
        return false;
    }
};

const safeRemove = (store: Storage, key: string): void => {
    if (!isBrowser) return;
    try {
        store.removeItem(key);
    } catch {
        /* no-op */
    }
};

export const sessionStore = {
    get: (key: string) => safeGet(globalThis.sessionStorage, key),
    set: (key: string, value: string) => safeSet(globalThis.sessionStorage, key, value),
    remove: (key: string) => safeRemove(globalThis.sessionStorage, key),
    clear: () => isBrowser && globalThis.sessionStorage.clear(),
    getJSON: <T = unknown>(key: string): T | null => {
        const raw = safeGet(globalThis.sessionStorage, key);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    },
    setJSON: (key: string, value: unknown) => safeSet(globalThis.sessionStorage, key, JSON.stringify(value)),
};

export const localStore = {
    get: (key: string) => safeGet(globalThis.localStorage, key),
    set: (key: string, value: string) => safeSet(globalThis.localStorage, key, value),
    remove: (key: string) => safeRemove(globalThis.localStorage, key),
    clear: () => isBrowser && globalThis.localStorage.clear(),
    keys: () => (isBrowser ? Object.keys(globalThis.localStorage) : []),
};

export interface SsoFlow {
    role: string;
    termsAccepted: boolean;
    ts: number;
}

// ── SSO flow flags — short-lived, TTL-bound, sessionStorage only ──
export const ssoFlags = {
    set(role: string, termsAccepted = true): void {
        sessionStore.set(
            "sso_flow",
            JSON.stringify({ role, termsAccepted, ts: Date.now() }),
        );
    },
    get(): SsoFlow | null {
        const raw = sessionStore.get("sso_flow");
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as SsoFlow;
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
    clear(): void {
        sessionStore.remove("sso_flow");
    },
};