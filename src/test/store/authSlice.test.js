import { describe, it, expect } from "vitest";
import reducer, {
    logout,
    setUser,
    setToken,
    setBootstrapped,
    clearMessages,
    registerUser,
    loginUser,
    sendOtp,
    verifyEmail,
    verifyMagicLink,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    logoutUser,
    redirectByRole,
} from "../../app/store/slices/authSlice";

const initialState = {
    user: null,
    token: null,
    isBootstrapping: true,
    loading: false,
    sending: false,
    error: null,
    successMsg: null,
    verifiedRole: null,
};

describe("authSlice reducers", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("logout clears user/token/error/successMsg", () => {
        const state = {
            ...initialState,
            user: { id: "u1" },
            token: "tok",
            error: "err",
            successMsg: "msg",
        };
        expect(reducer(state, logout())).toEqual({ ...state, user: null, token: null, error: null, successMsg: null });
    });

    it("setUser sets user and token from payload", () => {
        const action = setUser({ user: { id: "u1" }, token: "tok-1" });
        const result = reducer(initialState, action);
        expect(result.user).toEqual({ id: "u1" });
        expect(result.token).toBe("tok-1");
    });

    it("setToken updates only the token", () => {
        const result = reducer(initialState, setToken("new-tok"));
        expect(result.token).toBe("new-tok");
    });

    it("setBootstrapped flips isBootstrapping to false", () => {
        const result = reducer(initialState, setBootstrapped());
        expect(result.isBootstrapping).toBe(false);
    });

    it("clearMessages clears error and successMsg only", () => {
        const state = { ...initialState, error: "err", successMsg: "msg", user: { id: "u1" } };
        const result = reducer(state, clearMessages());
        expect(result.error).toBeNull();
        expect(result.successMsg).toBeNull();
        expect(result.user).toEqual({ id: "u1" });
    });
});

describe("authSlice extraReducers — registerUser", () => {
    it("pending sets loading and clears messages", () => {
        const state = { ...initialState, error: "old", successMsg: "old" };
        const result = reducer(state, { type: registerUser.pending.type });
        expect(result.loading).toBe(true);
        expect(result.error).toBeNull();
        expect(result.successMsg).toBeNull();
    });

    it("fulfilled sets token/user/successMsg from payload", () => {
        const action = { type: registerUser.fulfilled.type, payload: { accessToken: "tok", user: { id: "u1" } } };
        const result = reducer(initialState, action);
        expect(result.loading).toBe(false);
        expect(result.token).toBe("tok");
        expect(result.user).toEqual({ id: "u1" });
        expect(result.successMsg).toBe("Account created! Please verify your email.");
    });

    it("fulfilled defaults token to null and user to null when absent from payload", () => {
        const action = { type: registerUser.fulfilled.type, payload: {} };
        const result = reducer(initialState, action);
        expect(result.token).toBeNull();
        expect(result.user).toBeNull();
    });

    it("rejected sets error from payload", () => {
        const action = { type: registerUser.rejected.type, payload: "Registration failed." };
        const result = reducer(initialState, action);
        expect(result.loading).toBe(false);
        expect(result.error).toBe("Registration failed.");
    });
});

describe("authSlice extraReducers — loginUser", () => {
    it("pending/fulfilled/rejected mirror registerUser's pattern", () => {
        const pending = reducer(initialState, { type: loginUser.pending.type });
        expect(pending.loading).toBe(true);

        const fulfilled = reducer(initialState, {
            type: loginUser.fulfilled.type,
            payload: { accessToken: "tok", user: { id: "u1" } },
        });
        expect(fulfilled.token).toBe("tok");
        expect(fulfilled.successMsg).toBe("Login successful!");

        const rejected = reducer(initialState, { type: loginUser.rejected.type, payload: "Login failed." });
        expect(rejected.error).toBe("Login failed.");
    });
});

describe("authSlice extraReducers — sendOtp / verifyEmail / forgotPassword / verifyResetOtp / resetPassword", () => {
    it("sendOtp pending sets sending:true; fulfilled clears it with a success message", () => {
        const pending = reducer(initialState, { type: sendOtp.pending.type });
        expect(pending.sending).toBe(true);

        const fulfilled = reducer(initialState, { type: sendOtp.fulfilled.type });
        expect(fulfilled.sending).toBe(false);
        expect(fulfilled.successMsg).toBe("OTP sent to your email.");

        const rejected = reducer(initialState, { type: sendOtp.rejected.type, payload: "Failed to send OTP." });
        expect(rejected.sending).toBe(false);
        expect(rejected.error).toBe("Failed to send OTP.");
    });

    it("verifyEmail fulfilled sets the redirect success message", () => {
        const fulfilled = reducer(initialState, { type: verifyEmail.fulfilled.type });
        expect(fulfilled.successMsg).toBe("Email verified! Redirecting to login...");
    });

    it("verifyMagicLink fulfilled sets verifiedRole from payload.role", () => {
        const fulfilled = reducer(initialState, {
            type: verifyMagicLink.fulfilled.type,
            payload: { role: "mentor" },
        });
        expect(fulfilled.verifiedRole).toBe("mentor");
    });

    it("verifyMagicLink fulfilled defaults verifiedRole to null when payload has no role", () => {
        const fulfilled = reducer(initialState, { type: verifyMagicLink.fulfilled.type, payload: {} });
        expect(fulfilled.verifiedRole).toBeNull();
    });

    it("verifyMagicLink fulfilled defaults verifiedRole to null when payload itself is absent", () => {
        const fulfilled = reducer(initialState, { type: verifyMagicLink.fulfilled.type });
        expect(fulfilled.verifiedRole).toBeNull();
    });

    it("forgotPassword fulfilled sets the OTP-sent message", () => {
        const fulfilled = reducer(initialState, { type: forgotPassword.fulfilled.type });
        expect(fulfilled.successMsg).toBe("OTP sent! Check your email.");
    });

    it("verifyResetOtp fulfilled sets the OTP-verified message", () => {
        const fulfilled = reducer(initialState, { type: verifyResetOtp.fulfilled.type });
        expect(fulfilled.successMsg).toBe("OTP verified!");
    });

    it("resetPassword fulfilled sets the password-reset message", () => {
        const fulfilled = reducer(initialState, { type: resetPassword.fulfilled.type });
        expect(fulfilled.successMsg).toBe("Password reset! Redirecting to login...");
    });
});

describe("authSlice extraReducers — logoutUser", () => {
    it("fulfilled clears user/token/error/successMsg", () => {
        const state = {
            ...initialState,
            user: { id: "u1" },
            token: "tok",
            error: "err",
            successMsg: "msg",
        };
        const result = reducer(state, { type: logoutUser.fulfilled.type });
        expect(result).toEqual({ ...state, user: null, token: null, error: null, successMsg: null });
    });
});

describe("redirectByRole", () => {
    it("navigates to /dashboard/mentor when targetRole is mentor and roles include mentor", () => {
        const navigate = vi.fn();
        redirectByRole("mentor", navigate, ["mentor", "mentee"]);
        expect(navigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("navigates to /dashboard/mentee when targetRole is mentee and roles include mentee", () => {
        const navigate = vi.fn();
        redirectByRole("mentee", navigate, ["mentee"]);
        expect(navigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("falls back to mentor dashboard when targetRole doesn't match but roles include mentor", () => {
        const navigate = vi.fn();
        redirectByRole("mentee", navigate, ["mentor"]);
        expect(navigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("falls back to mentee dashboard when no mentor role and roles include mentee", () => {
        const navigate = vi.fn();
        redirectByRole("mentor", navigate, ["mentee"]);
        expect(navigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("navigates to / when roles is empty", () => {
        const navigate = vi.fn();
        redirectByRole("mentor", navigate, []);
        expect(navigate).toHaveBeenCalledWith("/");
    });

    it("defaults roles to [] when omitted entirely", () => {
        const navigate = vi.fn();
        redirectByRole("mentor", navigate);
        expect(navigate).toHaveBeenCalledWith("/");
    });
});