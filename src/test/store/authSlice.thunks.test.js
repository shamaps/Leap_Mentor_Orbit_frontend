import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import { injectStore } from "../../shared/utils/axiosInstance";
import * as Sentry from "@sentry/react";
import * as storage from "../../shared/utils/storage";
import logger from "../../shared/utils/logger";
import {
    registerUser,
    loginUser,
    sendOtp,
    verifyEmail,
    verifyMagicLink,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    logoutUser,
    logout,
} from "../../app/store/slices/authSlice";

const { mockSetUser, mockAddBreadcrumb } = vi.hoisted(() => ({
    mockSetUser: vi.fn(),
    mockAddBreadcrumb: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
    setUser: mockSetUser,
    addBreadcrumb: mockAddBreadcrumb,
}));
const BASE = "http://localhost:5000/api/v1";

function makeFakeStore(initialToken = null) {
    let token = initialToken;
    const dispatch = vi.fn((action) => {
        if (typeof action === "object" && action?.type === "auth/setToken") token = action.payload;
        if (typeof action === "object" && action?.type === "auth/logout") token = null;
    });
    return { dispatch, getState: () => ({ auth: { token } }) };
}

const runThunk = async (thunkCreator, arg) => {
    const store = makeFakeStore(null);
    injectStore(store);
    const dispatch = vi.fn();
    const action = await thunkCreator(arg)(dispatch, () => ({}), undefined);
    return { action, dispatch };
};

describe("authSlice thunks", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        injectStore(makeFakeStore(null));
        mockSetUser.mockClear();
        mockAddBreadcrumb.mockClear();
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it("registerUser fulfills with mapped API data on success", async () => {
        server.use(
            http.post(`${BASE}/auth/register`, () =>
                HttpResponse.json({
                    success: true,
                    data: { user: { _id: "u1", name: "Jane" }, accessToken: "tok" },
                }),
            ),
        );
        const { action } = await runThunk(registerUser, {
            name: "Jane", email: "j@x.com", password: "Pw1!", roles: ["mentee"], termsAccepted: true,
        });
        expect(action.type).toBe("auth/registerUser/fulfilled");
        expect(action.payload.accessToken).toBe("tok");
        expect(action.payload.user.name).toBe("Jane");
    });

    it("registerUser rejects with the server's validation message on failure", async () => {
        server.use(
            http.post(`${BASE}/auth/register`, () =>
                HttpResponse.json({ message: "Email taken" }, { status: 400 }),
            ),
        );
        const { action } = await runThunk(registerUser, { name: "Jane" });
        expect(action.type).toBe("auth/registerUser/rejected");
        expect(action.payload).toBe("Email taken");
    });

    it("loginUser fulfills with mapped API data on success", async () => {
        server.use(
            http.post(`${BASE}/auth/login`, () =>
                HttpResponse.json({ success: true, data: { user: { _id: "u1" }, accessToken: "tok" } }),
            ),
        );
        const { action } = await runThunk(loginUser, { email: "j@x.com", password: "pw" });
        expect(action.type).toBe("auth/loginUser/fulfilled");
    });

    it("loginUser rejects with the server's message on failure", async () => {
        server.use(
            http.post(`${BASE}/auth/login`, () =>
                HttpResponse.json({ message: "Invalid credentials" }, { status: 400 }),
            ),
        );
        const { action } = await runThunk(loginUser, { email: "j@x.com", password: "wrong" });
        expect(action.type).toBe("auth/loginUser/rejected");
        expect(action.payload).toBe("Invalid credentials");
    });

    it("sendOtp fulfills on success", async () => {
        server.use(http.post(`${BASE}/verification/send`, () => HttpResponse.json({ message: "sent" })));
        const { action } = await runThunk(sendOtp, { email: "j@x.com" });
        expect(action.type).toBe("auth/sendOtp/fulfilled");
    });

    it("sendOtp rejects, surfacing the underlying error message on a network-style failure", async () => {
        server.use(http.post(`${BASE}/verification/send`, () => HttpResponse.error()));
        const { action } = await runThunk(sendOtp, { email: "j@x.com" });
        expect(action.type).toBe("auth/sendOtp/rejected");
        expect(action.payload).toBe("Network Error");
    });

    it("verifyEmail fulfills on success", async () => {
        server.use(http.post(`${BASE}/verification/verify-otp`, () => HttpResponse.json({ ok: true })));
        const { action } = await runThunk(verifyEmail, { email: "j@x.com", otp: "123456" });
        expect(action.type).toBe("auth/verifyEmail/fulfilled");
    });

    it("verifyEmail rejects, surfacing the underlying error message on failure", async () => {
        server.use(http.post(`${BASE}/verification/verify-otp`, () => HttpResponse.error()));
        const { action } = await runThunk(verifyEmail, { email: "j@x.com", otp: "000000" });
        expect(action.payload).toBe("Network Error");
    });

    it("verifyMagicLink fulfills using axiosInstance directly", async () => {
        server.use(
            http.get(`${BASE}/verification/verify/tok123`, ({ request }) => {
                const url = new URL(request.url);
                expect(url.searchParams.get("email")).toBe("j@x.com");
                return HttpResponse.json({ role: "mentee" });
            }),
        );
        const { action } = await runThunk(verifyMagicLink, { token: "tok123", email: "j@x.com" });
        expect(action.type).toBe("auth/verifyMagicLink/fulfilled");
        expect(action.payload).toEqual({ role: "mentee" });
    });

    it("verifyMagicLink rejects, surfacing the underlying error message on failure", async () => {
        server.use(http.get(`${BASE}/verification/verify/bad`, () => HttpResponse.error()));
        const { action } = await runThunk(verifyMagicLink, { token: "bad", email: "j@x.com" });
        expect(action.payload).toBe("Network Error");
    }, 10000);

    it("forgotPassword fulfills on success", async () => {
        server.use(http.post(`${BASE}/auth/password-reset`, () => HttpResponse.json({ ok: true })));
        const { action } = await runThunk(forgotPassword, { email: "j@x.com" });
        expect(action.type).toBe("auth/forgotPassword/fulfilled");
    });

    it("forgotPassword rejects, surfacing the underlying error message on failure", async () => {
        server.use(http.post(`${BASE}/auth/password-reset`, () => HttpResponse.error()));
        const { action } = await runThunk(forgotPassword, { email: "j@x.com" });
        expect(action.payload).toBe("Network Error");
    });

    it("verifyResetOtp rejects using response.data.message when present", async () => {
        server.use(
            http.post(`${BASE}/auth/password-reset/verification`, () =>
                HttpResponse.json({ message: "OTP expired" }, { status: 400 }),
            ),
        );
        const { action } = await runThunk(verifyResetOtp, { email: "j@x.com", otp: "000000" });
        expect(action.payload).toBe("OTP expired");
    });

    it("verifyResetOtp fulfills on success", async () => {
        server.use(
            http.post(`${BASE}/auth/password-reset/verification`, () => HttpResponse.json({ ok: true })),
        );
        const { action } = await runThunk(verifyResetOtp, { email: "j@x.com", otp: "123456" });
        expect(action.type).toBe("auth/verifyResetOtp/fulfilled");
    });

    it("verifyResetOtp falls back to err.message when there's no response body at all", async () => {
        server.use(http.post(`${BASE}/auth/password-reset/verification`, () => HttpResponse.error()));
        const { action } = await runThunk(verifyResetOtp, { email: "j@x.com", otp: "000000" });
        expect(action.payload).toBe("Network Error");
    });

    it("resetPassword fulfills on success", async () => {
        server.use(
            http.post(`${BASE}/auth/password-reset/confirmation`, () => HttpResponse.json({ ok: true })),
        );
        const { action } = await runThunk(resetPassword, {
            email: "j@x.com", otp: "123456", newPassword: "NewPw1!",
        });
        expect(action.type).toBe("auth/resetPassword/fulfilled");
    });

    it("resetPassword falls back to err.message when there's no response body at all", async () => {
        server.use(http.post(`${BASE}/auth/password-reset/confirmation`, () => HttpResponse.error()));
        const { action } = await runThunk(resetPassword, { email: "j@x.com" });
        expect(action.payload).toBe("Network Error");
    });

//    it("logoutUser clears storage, calls Sentry.setUser(null), and dispatches logout()", async () => {
//     server.use(http.post(`${BASE}/auth/logout`, () => HttpResponse.json({ ok: true })));
//     vi.spyOn(storage.localStore, "keys").mockReturnValue(["k1", "k2"]);
//     const clearSpy = vi.spyOn(storage.localStore, "clear").mockImplementation(() => { });
//     const sessionClearSpy = vi.spyOn(storage.sessionStore, "clear").mockImplementation(() => { });

//     const { action, dispatch } = await runThunk(logoutUser);

//     expect(clearSpy).toHaveBeenCalled();
//     expect(sessionClearSpy).toHaveBeenCalled();
//     expect(mockSetUser).toHaveBeenCalledWith(null);
//     expect(mockAddBreadcrumb).toHaveBeenCalledWith(
//         expect.objectContaining({ message: "Logout cleared 2 localStorage key(s)" }),
//     );
//     expect(dispatch).toHaveBeenCalledWith(logout());
//     expect(action.type).toBe("auth/logoutUser/fulfilled");
// });

    it("logoutUser skips the Sentry breadcrumb when no localStorage keys remain", async () => {
        server.use(http.post(`${BASE}/auth/logout`, () => HttpResponse.json({ ok: true })));
        vi.spyOn(storage.localStore, "keys").mockReturnValue([]);
        vi.spyOn(storage.localStore, "clear").mockImplementation(() => { });
        vi.spyOn(storage.sessionStore, "clear").mockImplementation(() => { });
        vi.spyOn(Sentry, "setUser").mockImplementation(() => { });
        const sentryBreadcrumbSpy = vi.spyOn(Sentry, "addBreadcrumb").mockImplementation(() => { });

        await runThunk(logoutUser);
        expect(sentryBreadcrumbSpy).not.toHaveBeenCalled();
    });

    it("logoutUser proceeds and still logs out even if the backend logout call fails", async () => {
        server.use(http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 500 })));
        vi.spyOn(storage.localStore, "keys").mockReturnValue([]);
        vi.spyOn(storage.localStore, "clear").mockImplementation(() => { });
        vi.spyOn(storage.sessionStore, "clear").mockImplementation(() => { });
        vi.spyOn(Sentry, "setUser").mockImplementation(() => { });
        const loggerErrorSpy = vi.spyOn(logger, "error").mockImplementation(() => { });

        const { action, dispatch } = await runThunk(logoutUser);

        expect(loggerErrorSpy).toHaveBeenCalledWith(
            "[authSlice] Logout request failed",
            expect.objectContaining({ status: 500 }),
        );
        expect(dispatch).toHaveBeenCalledWith(logout());
        expect(action.type).toBe("auth/logoutUser/fulfilled");
    });
});