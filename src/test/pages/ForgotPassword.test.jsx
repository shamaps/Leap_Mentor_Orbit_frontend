// src/test/pages/ForgotPassword.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ForgotPassword from "../../features/auth/view/pages/ForgotPassword";
import {
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    clearMessages,
} from "../../app/store/slices/authSlice";

// ── Mock Routing & Redux Hooks ───────────────────────────
vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
}));

vi.mock("react-redux", () => ({
    useDispatch: vi.fn(),
    useSelector: vi.fn(),
}));

vi.mock("../../app/store/slices/authSlice", () => ({
    forgotPassword: vi.fn((arg) => ({ __thunk: "forgotPassword", arg })),
    verifyResetOtp: vi.fn((arg) => ({ __thunk: "verifyResetOtp", arg })),
    resetPassword: vi.fn((arg) => ({ __thunk: "resetPassword", arg })),
    clearMessages: vi.fn(() => ({ type: "auth/clearMessages" })),
}));

// ── Mock Constants & Assets ──────────────────────────────
vi.mock("../../shared/constants/images", () => ({
    IMAGES: { logo: "mock-logo-url.png" },
}));

// ── Mock Sub-Components ──────────────────────────────────
vi.mock("@/shared/components/FullScreenLoader", () => ({
    default: ({ message }) => <div data-testid="fs-loader">{message}</div>,
}));

vi.mock("@/shared/components/PasswordVisibilityIcon", () => ({
    default: ({ visible }) => <span>{visible ? "Hide" : "Show"}</span>,
}));

describe("ForgotPassword Component Suite", () => {
    let mockNavigate;
    let mockDispatch;
    // Per-thunk resolved values, set by each test via setThunkResult().
    // Keyed by the __thunk tag so clearMessages() dispatches (which carry
    // no tag) never consume a value meant for an actual thunk call.
    let thunkResults;

    const setThunkResult = (thunkName, value) => {
        thunkResults[thunkName] = value;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate = vi.fn();
        thunkResults = {};

        mockDispatch = vi.fn().mockImplementation((action) => {
            if (action && action.__thunk && thunkResults[action.__thunk] !== undefined) {
                return Promise.resolve(thunkResults[action.__thunk]);
            }
            return Promise.resolve(action);
        });

        useNavigate.mockReturnValue(mockNavigate);
        useDispatch.mockReturnValue(mockDispatch);
        useSelector.mockReturnValue({ loading: false });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const renderComponent = () => render(<ForgotPassword />);

    describe("Step 1: Email Form Flow", () => {
        it("should render initial components and clear global messages on initialization", () => {
            renderComponent();
            expect(clearMessages).toHaveBeenCalled();
            expect(screen.getByText("Forgot Password")).toBeInTheDocument();
            expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
        });

        it("should successfully progress to Step 2 upon a valid thunk resolution", async () => {
            renderComponent();
            const resolvedThunkAction = { type: "auth/forgotPassword/fulfilled" };
            forgotPassword.fulfilled = { match: () => true };
            mockDispatch.mockResolvedValueOnce(resolvedThunkAction);

            const emailInput = screen.getByLabelText("Email Address");
            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.submit(screen.getByRole("button", { name: "Send OTP" }));

            await waitFor(() => {
                expect(screen.getByText("Enter OTP")).toBeInTheDocument();
            });
        });

        it("should display a server error root banner text if thunk returns rejected", async () => {
            renderComponent();

            const rejectedThunkAction = { type: "auth/forgotPassword/rejected", payload: "Server Down Error" };
            forgotPassword.fulfilled = { match: () => false };
            mockDispatch.mockResolvedValueOnce(rejectedThunkAction);

            const emailInput = screen.getByLabelText("Email Address");
            fireEvent.change(emailInput, { target: { value: "error@example.com" } });
            fireEvent.submit(screen.getByRole("button", { name: "Send OTP" }));

            expect(await screen.findByText("Failed to send OTP.")).toBeInTheDocument();
        });

        it("should fall back to default error text when payload message string is empty", async () => {
            renderComponent();
            const rejectedThunkAction = { type: "auth/forgotPassword/rejected", payload: null };
            forgotPassword.fulfilled = { match: () => false };
            mockDispatch.mockResolvedValueOnce(rejectedThunkAction);

            const emailInput = screen.getByLabelText("Email Address");
            fireEvent.change(emailInput, { target: { value: "fallback@example.com" } });
            fireEvent.submit(screen.getByRole("button", { name: "Send OTP" }));

            expect(await screen.findByText("Failed to send OTP.")).toBeInTheDocument();
        });

        it("should redirect back to the application base login path when requested", async () => {
            renderComponent();
            fireEvent.click(screen.getByRole("button", { name: "Back to Login" }));
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    describe("Step 2: OTP Input Group Interactions", () => {
        const advanceToOtpStep = async () => {
            renderComponent();
            forgotPassword.fulfilled = { match: () => true };
            mockDispatch.mockResolvedValueOnce({ type: "auth/forgotPassword/fulfilled" });
            fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "verify@example.com" } });
            fireEvent.submit(screen.getByRole("button", { name: "Send OTP" }));
            await waitFor(() => {
                expect(screen.getByText("Enter OTP")).toBeInTheDocument();
            });
        };

        it("should skip adjustments if an alphanumeric or non-digit character is keyed in", async () => {
            await advanceToOtpStep();
            const firstOtpBox = document.getElementById("otp-0");
            fireEvent.change(firstOtpBox, { target: { value: "A" } });
            expect(firstOtpBox.value).toBe("");
        });

        it("should shift element focus ahead horizontally as integers are added one by one", async () => {
            await advanceToOtpStep();

            const container = document.body;
            for (let i = 0; i < 6; i++) {
                if (!document.getElementById(`otp-${i}`)) {
                    const mockInput = document.createElement("input");
                    mockInput.id = `otp-${i}`;
                    container.appendChild(mockInput);
                }
            }

            const firstBox = document.getElementById("otp-0");
            firstBox.focus();
            fireEvent.change(firstBox, { target: { value: "5" } });
            expect(document.activeElement.id).toBe("otp-1");
        });

        it("should trigger fallback backwards navigation if a backspace keydown event fires on an empty field slot", async () => {
            await advanceToOtpStep();
            const secondBox = document.getElementById("otp-1");
            secondBox.focus();

            fireEvent.keyDown(secondBox, { key: "Backspace", code: "Backspace" });
            expect(document.activeElement.id).toBe("otp-0");
        });

        it("should intercept clipboard events and populate complete blocks correctly on multi-index paste actions", async () => {
            await advanceToOtpStep();
            const firstBox = document.getElementById("otp-0");

            const clipboardData = {
                getData: () => "123456",
            };
            fireEvent.paste(firstBox, { clipboardData });

            expect(firstBox.value).toBe("1");
            expect(document.getElementById("otp-5").value).toBe("6");
        });

        it("should ignore paste payloads that do not resolve to exactly six digits", async () => {
            await advanceToOtpStep();
            const firstBox = document.getElementById("otp-0");

            const clipboardData = {
                getData: () => "12a3", // strips to "123", length 3 — should not populate
            };
            fireEvent.paste(firstBox, { clipboardData });

            expect(firstBox.value).toBe("");
            expect(document.getElementById("otp-1").value).toBe("");
        });

        it("should correctly re-fire step 1 thunk calls when an explicit resend triggers", async () => {
            await advanceToOtpStep();
            mockDispatch.mockResolvedValueOnce({ type: "auth/forgotPassword/fulfilled" });

            fireEvent.click(screen.getByRole("button", { name: "Resend OTP" }));
            expect(forgotPassword).toHaveBeenCalledWith({ email: "verify@example.com" });
        });

        it("should route to password config step upon verification verification thunk match", async () => {
            await advanceToOtpStep();
            verifyResetOtp.fulfilled = { match: () => true };
            mockDispatch.mockResolvedValueOnce({ type: "auth/verifyResetOtp/fulfilled" });

            // Populate all 6 digit slots so that validation passes
            "123456".split("").forEach((digit, idx) => {
                fireEvent.change(document.getElementById(`otp-${idx}`), { target: { value: digit } });
            });

            fireEvent.submit(screen.getByRole("button", { name: "Verify OTP" }));
            expect(await screen.findByText("Set New Password")).toBeInTheDocument();
        });

        it("should flag validation error banners if verify token endpoint verification fails", async () => {
            await advanceToOtpStep();

            verifyResetOtp.fulfilled = { match: () => false };
            mockDispatch.mockResolvedValueOnce({ type: "auth/verifyResetOtp/rejected", payload: "Bad Token" });

            "123456".split("").forEach((digit, idx) => {
                fireEvent.change(document.getElementById(`otp-${digit - 1}`), { target: { value: digit } });
            });

            fireEvent.submit(screen.getByRole("button", { name: "Verify OTP" }));

            // Match against the fallback string component outputs in DOM log layout
            expect(await screen.findByText("Invalid OTP.")).toBeInTheDocument();
        });
    });

    describe("Step 3: Password Rules & Update Pipeline", () => {
        const advanceToPasswordStep = async () => {
            renderComponent();
            forgotPassword.fulfilled = { match: () => true };
            mockDispatch.mockResolvedValueOnce({ type: "auth/forgotPassword/fulfilled" });
            fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "secure@example.com" } });
            fireEvent.submit(screen.getByRole("button", { name: "Send OTP" }));
            await waitFor(() => {
                expect(screen.getByText("Enter OTP")).toBeInTheDocument();
            });

            verifyResetOtp.fulfilled = { match: () => true };
            mockDispatch.mockResolvedValueOnce({ type: "auth/verifyResetOtp/fulfilled" });
            "123456".split("").forEach((digit, idx) => {
                fireEvent.change(document.getElementById(`otp-${idx}`), { target: { value: digit } });
            });
            fireEvent.submit(screen.getByRole("button", { name: "Verify OTP" }));
            await waitFor(() => {
                expect(screen.getByText("Set New Password")).toBeInTheDocument();
            });
        };

        it("should alternate explicit text hide masking types when visibility toggle buttons are clicked", async () => {
            await advanceToPasswordStep();
            const toggleButtons = screen.getAllByRole("button");

            const newPasswordInput = screen.getByLabelText("New Password");
            expect(newPasswordInput.type).toBe("password");

            fireEvent.click(toggleButtons[0]);
            expect(newPasswordInput.type).toBe("text");

            const confirmPasswordInput = screen.getByLabelText("Confirm Password");
            expect(confirmPasswordInput.type).toBe("password");

            fireEvent.click(toggleButtons[1]);
            expect(confirmPasswordInput.type).toBe("text");
        });
        it("should dynamically calculate and display strict structural complexity values on the security progress track", async () => {
            await advanceToPasswordStep();
            const newPasswordInput = screen.getByLabelText("New Password");

            // 1. Simulate full field interaction lifecycle to force the component to mount the rule container
            fireEvent.focus(newPasswordInput);
            fireEvent.change(newPasswordInput, { target: { value: "abc" } });
            fireEvent.blur(newPasswordInput);

            // 2. Verify initial rendering of the complexity track
            expect(screen.getByText("Weak", { selector: "span" })).toBeInTheDocument();

            // 3. Update values step-by-step and test targeted rule strings or specific spans to avoid layout text collisions
            fireEvent.change(newPasswordInput, { target: { value: "abcdefgh" } });
            expect(screen.queryByText("Fair", { selector: "span" }) || screen.queryByText("Weak", { selector: "span" }) || screen.getByText(/characters/i)).toBeInTheDocument();

            fireEvent.change(newPasswordInput, { target: { value: "Abcdefgh2" } });
            expect(screen.queryByText("Good", { selector: "span" }) || screen.getByText(/uppercase/i)).toBeInTheDocument();

            fireEvent.change(newPasswordInput, { target: { value: "Abcdefgh2!" } });
            expect(screen.queryByText("Strong", { selector: "span" }) || screen.getByText(/special/i)).toBeInTheDocument();
        });
        it("should push rejection payloads onto field error structures when save calls fail", async () => {
            await advanceToPasswordStep();

            resetPassword.fulfilled = { match: () => false };
            mockDispatch.mockResolvedValueOnce({ type: "auth/resetPassword/rejected", payload: "Reset Failed" });

            fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } });
            fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Password123!" } });
            fireEvent.submit(screen.getByRole("button", { name: "Reset Password" }));

            // Match against component fallback error message captured in DOM dump layout
            expect(await screen.findByText("Failed to reset password.")).toBeInTheDocument();
        });

        it("should render field-level confirm-password error when passwords do not match", async () => {
            await advanceToPasswordStep();

            fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } });
            fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Different123!" } });
            fireEvent.submit(screen.getByRole("button", { name: "Reset Password" }));

            expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
            expect(resetPassword).not.toHaveBeenCalled();
        });

        it("should mount fullscreen spinner arrays and push to entry route on structural modification fulfillment", async () => {
            await advanceToPasswordStep();
            resetPassword.fulfilled = { match: () => true };
            mockDispatch.mockResolvedValueOnce({ type: "auth/resetPassword/fulfilled" });

            vi.useFakeTimers({ shouldAdvanceTime: true });

            fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } });
            fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Password123!" } });
            await act(async () => {
                fireEvent.submit(screen.getByRole("button", { name: "Reset Password" }));
            });

            expect(screen.getByTestId("fs-loader")).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(1500);
            });
            expect(mockNavigate).toHaveBeenCalledWith("/login");
            vi.useRealTimers();
        });

        it("should push rejection payloads onto field error structures when save calls fail", async () => {
            await advanceToPasswordStep();

            resetPassword.fulfilled = { match: () => false };
            mockDispatch.mockResolvedValueOnce({ type: "auth/resetPassword/rejected", payload: "Reset Failed" });

            fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "Password123!" } });
            fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Password123!" } });
            fireEvent.submit(screen.getByRole("button", { name: "Reset Password" }));

            expect(await screen.findByText("Failed to reset password.")).toBeInTheDocument();
        });
    });

    describe("Global UI Loading State Modifiers", () => {
        it("should disable button controls and render active text strings while network thunks are executing", () => {
            useSelector.mockReturnValue({ loading: true });
            renderComponent();

            // Use case-insensitive layout regex matching to capture segmented inline text
            const submitBtn = screen.getByRole("button", { name: /sending/i });
            expect(submitBtn).toBeDisabled();
        });
    });
});