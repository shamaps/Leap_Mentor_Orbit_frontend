import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    registerUser, loginUser, sendOtp, verifyEmailOtp, verifyMagicLink,
    forgotPassword, verifyResetOtp, resetPassword, logoutRequest,
    getCurrentUser, changePassword,
} from "@/features/auth/model/auth.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("auth.api", () => {
    it("registerUser: POSTs the exact payload and maps the response", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/auth/register`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({
                    user: { _id: "u1", name: "Shama", email: "s@test.com", roles: ["mentee"], isVerified: false },
                    accessToken: "tok123",
                    isNewUser: true,
                });
            }),
        );

        const result = await registerUser({
            name: "Shama", email: "s@test.com", password: "pw123456",
            roles: ["mentee"], termsAccepted: true,
        });

        expect(receivedBody).toEqual({
            name: "Shama", email: "s@test.com", password: "pw123456",
            roles: ["mentee"], termsAccepted: true,
        });
        expect(result).toEqual({
            user: { id: "u1", name: "Shama", email: "s@test.com", roles: ["mentee"], isVerified: false },
            accessToken: "tok123",
            isNewUser: true,
        });
    });

    it("loginUser: POSTs { email, password } to /auth/login", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/auth/login`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({
                    user: { _id: "u1", name: "Shama", email: "s@test.com", roles: ["mentor"], isVerified: true },
                    accessToken: "tok456",
                    isNewUser: false,
                });
            }),
        );
        const result = await loginUser({ email: "s@test.com", password: "pw123456" });
        expect(receivedBody).toEqual({ email: "s@test.com", password: "pw123456" });
        expect(result.accessToken).toBe("tok456");
    });

    it("sendOtp: trims the email and POSTs to /verification/send", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/verification/send`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ message: "OTP sent" });
            }),
        );
        const result = await sendOtp("  s@test.com  ");
        expect(receivedBody).toEqual({ email: "s@test.com" });
        expect(result).toEqual({ message: "OTP sent" });
    });

    it("verifyEmailOtp: POSTs trimmed email + otp", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/verification/verify-otp`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ verified: true });
            }),
        );
        await verifyEmailOtp(" s@test.com ", "123456");
        expect(receivedBody).toEqual({ email: "s@test.com", otp: "123456" });
    });

    it("verifyMagicLink: GETs /verification/verify/:token?email=... URL-encoded", async () => {
        let capturedUrl;
        server.use(
            http.get(`${BASE}/verification/verify/:token`, ({ request, params }) => {
                capturedUrl = request.url;
                expect(params.token).toBe("tok-abc");
                return envelope({ verified: true });
            }),
        );
        await verifyMagicLink("tok-abc", "a+b@test.com");
        expect(capturedUrl).toContain(`email=${encodeURIComponent("a+b@test.com")}`);
    });

    it("forgotPassword: POSTs trimmed email", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/auth/password-reset`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ message: "sent" });
            }),
        );
        await forgotPassword(" s@test.com ");
        expect(receivedBody).toEqual({ email: "s@test.com" });
    });

    it("verifyResetOtp: POSTs { email, otp }", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/auth/password-reset/verification`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ verified: true });
            }),
        );
        await verifyResetOtp(" s@test.com ", "654321");
        expect(receivedBody).toEqual({ email: "s@test.com", otp: "654321" });
    });

    it("resetPassword: POSTs { email, otp, newPassword }", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/auth/password-reset/confirmation`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ message: "reset" });
            }),
        );
        await resetPassword(" s@test.com ", "111111", "newpw123");
        expect(receivedBody).toEqual({ email: "s@test.com", otp: "111111", newPassword: "newpw123" });
    });

    it("logoutRequest: POSTs to /auth/logout, returns nothing", async () => {
        let wasHit = false;
        server.use(http.post(`${BASE}/auth/logout`, () => { wasHit = true; return envelope({}); }));
        const result = await logoutRequest();
        expect(wasHit).toBe(true);
        expect(result).toBeUndefined();
    });

    it("changePassword: PATCHes { currentPassword, newPassword }", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/auth/password`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({ message: "changed" });
            }),
        );
        await changePassword("oldpw", "newpw");
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({ currentPassword: "oldpw", newPassword: "newpw" });
    });

    it("getCurrentUser: GETs /users/me and maps the response", async () => {
        server.use(
            http.get(`${BASE}/users/me`, () =>
                envelope({ _id: "u1", name: "Shama", email: "s@test.com", roles: ["mentee"], isVerified: true }),
            ),
        );
        const result = await getCurrentUser();
        expect(result).toEqual({
            id: "u1", name: "Shama", email: "s@test.com", roles: ["mentee"], isVerified: true,
        });
    });
});