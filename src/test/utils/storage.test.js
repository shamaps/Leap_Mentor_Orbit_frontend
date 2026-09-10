import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sessionStore, localStore, ssoFlags } from "../../shared/utils/storage";

describe("sessionStore", () => {
    beforeEach(() => {
        globalThis.sessionStorage.clear();
    });

    it("set/get roundtrips a plain string value", () => {
        sessionStore.set("key1", "value1");
        expect(sessionStore.get("key1")).toBe("value1");
    });

    it("returns null for a missing key", () => {
        expect(sessionStore.get("missing")).toBeNull();
    });

    it("remove deletes a stored key", () => {
        sessionStore.set("key1", "value1");
        sessionStore.remove("key1");
        expect(sessionStore.get("key1")).toBeNull();
    });

    it("clear wipes all keys", () => {
        sessionStore.set("a", "1");
        sessionStore.set("b", "2");
        sessionStore.clear();
        expect(sessionStore.get("a")).toBeNull();
        expect(sessionStore.get("b")).toBeNull();
    });

    it("setJSON/getJSON roundtrips an object", () => {
        sessionStore.setJSON("obj", { a: 1, b: "two" });
        expect(sessionStore.getJSON("obj")).toEqual({ a: 1, b: "two" });
    });

    it("getJSON returns null for a missing key", () => {
        expect(sessionStore.getJSON("missing")).toBeNull();
    });

    it("getJSON returns null and doesn't throw on malformed JSON", () => {
        globalThis.sessionStorage.setItem("bad", "{not valid json");
        expect(sessionStore.getJSON("bad")).toBeNull();
    });

    it("get returns null when the underlying store throws", () => {
        const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("quota exceeded");
        });
        try {
            expect(sessionStore.get("key1")).toBeNull();
        } finally {
            spy.mockRestore();
        }
    });

    it("set returns false when the underlying store throws", () => {
        const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota exceeded");
        });
        expect(sessionStore.set("key1", "value1")).toBe(false);
        spy.mockRestore();
    });
});

describe("localStore", () => {
    beforeEach(() => {
        globalThis.localStorage.clear();
    });

    it("set/get roundtrips a plain string value", () => {
        localStore.set("key1", "value1");
        expect(localStore.get("key1")).toBe("value1");
    });

    it("remove deletes a stored key", () => {
        localStore.set("key1", "value1");
        localStore.remove("key1");
        expect(localStore.get("key1")).toBeNull();
    });

    it("clear wipes all keys", () => {
        localStore.set("a", "1");
        localStore.clear();
        expect(localStore.get("a")).toBeNull();
    });

    it("keys returns all stored keys", () => {
        localStore.set("a", "1");
        localStore.set("b", "2");
        expect(localStore.keys().sort()).toEqual(["a", "b"]);
    });

    it("remove does not throw when the underlying store throws", () => {
        const spy = vi.spyOn(globalThis.localStorage, "removeItem").mockImplementation(() => {
            throw new Error("boom");
        });
        expect(() => localStore.remove("key1")).not.toThrow();
        spy.mockRestore();
    });
});
describe("isBrowser = false branch", () => {
    it("safeGet/safeSet/safeRemove no-op when window is undefined (SSR-like environment)", async () => {
        vi.resetModules();
        const originalWindow = globalThis.window;
        // @ts-expect-error simulating non-browser env
        delete globalThis.window;

        const { sessionStore: freshSessionStore, localStore: freshLocalStore } = await import(
            "../../shared/utils/storage"
        );

        expect(freshSessionStore.get("anything")).toBeNull();
        expect(freshSessionStore.set("a", "1")).toBe(false);
        expect(() => freshSessionStore.remove("a")).not.toThrow();
        expect(freshLocalStore.keys()).toEqual([]);

        globalThis.window = originalWindow;
        vi.resetModules();
    });
});
describe("ssoFlags", () => {
    beforeEach(() => {
        globalThis.sessionStorage.clear();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-07-09T10:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("set stores role, termsAccepted, and a timestamp", () => {
        ssoFlags.set("mentee", true);
        const stored = JSON.parse(globalThis.sessionStorage.getItem("sso_flow"));
        expect(stored).toEqual({ role: "mentee", termsAccepted: true, ts: Date.now() });
    });

    it("set defaults termsAccepted to true", () => {
        ssoFlags.set("mentor");
        const stored = JSON.parse(globalThis.sessionStorage.getItem("sso_flow"));
        expect(stored.termsAccepted).toBe(true);
    });

    it("get returns the stored flag within the TTL window", () => {
        ssoFlags.set("mentee", true);
        expect(ssoFlags.get()).toEqual({ role: "mentee", termsAccepted: true, ts: Date.now() });
    });

    it("get returns null and clears the flag once expired", () => {
        ssoFlags.set("mentee", true);
        vi.advanceTimersByTime(11 * 60 * 1000); // past the 10-minute TTL
        expect(ssoFlags.get()).toBeNull();
        expect(globalThis.sessionStorage.getItem("sso_flow")).toBeNull();
    });

    it("get returns null when nothing is stored", () => {
        expect(ssoFlags.get()).toBeNull();
    });

    it("get returns null and clears on malformed stored JSON", () => {
        globalThis.sessionStorage.setItem("sso_flow", "{not valid json");
        expect(ssoFlags.get()).toBeNull();
        expect(globalThis.sessionStorage.getItem("sso_flow")).toBeNull();
    });

    it("clear removes the stored flag", () => {
        ssoFlags.set("mentee", true);
        ssoFlags.clear();
        expect(globalThis.sessionStorage.getItem("sso_flow")).toBeNull();
    });
});