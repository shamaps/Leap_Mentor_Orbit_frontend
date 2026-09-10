import { describe, it, expect } from "vitest";
import { mapUser, mapAuthResponse } from "../../features/auth/model/authMapper";

describe("mapUser", () => {
    it("returns null when given a falsy value", () => {
        expect(mapUser(null)).toBeNull();
        expect(mapUser(undefined)).toBeNull();
    });

    it("maps a full raw user, preferring _id over id", () => {
        const raw = {
            _id: "u1",
            id: "should-not-use-this",
            name: "Jane Doe",
            email: "jane@example.com",
            roles: ["mentee"],
            isVerified: true,
        };
        expect(mapUser(raw)).toEqual({
            id: "u1",
            name: "Jane Doe",
            email: "jane@example.com",
            roles: ["mentee"],
            isVerified: true,
        });
    });

    it("falls back to id when _id is missing", () => {
        const raw = { id: "u2", name: "Bob" };
        expect(mapUser(raw).id).toBe("u2");
    });

    it("defaults name, email, and roles when absent", () => {
        const raw = { _id: "u3" };
        expect(mapUser(raw)).toEqual({
            id: "u3",
            name: "",
            email: "",
            roles: [],
            isVerified: false,
        });
    });

    it("coerces a truthy isVerified value to boolean true", () => {
        expect(mapUser({ _id: "u4", isVerified: "yes" }).isVerified).toBe(true);
    });

    it("coerces a falsy isVerified value to boolean false", () => {
        expect(mapUser({ _id: "u5", isVerified: 0 }).isVerified).toBe(false);
    });

    it("coerces undefined isVerified to false", () => {
        expect(mapUser({ _id: "u6" }).isVerified).toBe(false);
    });
});

describe("mapAuthResponse", () => {
    it("maps a full auth response", () => {
        const raw = {
            user: { _id: "u1", name: "Jane" },
            accessToken: "tok-123",
            isNewUser: false,
        };
        const result = mapAuthResponse(raw);
        expect(result.user).toEqual(mapUser(raw.user));
        expect(result.accessToken).toBe("tok-123");
        expect(result.isNewUser).toBe(false);
    });

    it("maps user to null when raw.user is absent", () => {
        const result = mapAuthResponse({});
        expect(result.user).toBeNull();
    });

    it("defaults accessToken to null when absent", () => {
        expect(mapAuthResponse({ user: null }).accessToken).toBeNull();
    });

    it("defaults isNewUser to true when absent", () => {
        expect(mapAuthResponse({ user: null }).isNewUser).toBe(true);
    });

    it("respects an explicit isNewUser: false (not just absence)", () => {
        expect(mapAuthResponse({ user: null, isNewUser: false }).isNewUser).toBe(false);
    });
});