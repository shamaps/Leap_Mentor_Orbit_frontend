// src/test/pages/VerifyEmail.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import VerifyEmail from "../../features/auth/view/pages/VerifyEmail";
import { sendOtp, verifyEmail, verifyMagicLink, clearMessages } from "../../app/store/slices/authSlice";

vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
    useSearchParams: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useDispatch: vi.fn(),
    useSelector: vi.fn(),
}));

vi.mock("../../app/store/slices/authSlice", () => ({
    sendOtp: vi.fn((arg) => ({ __thunk: "sendOtp", arg })),
    verifyEmail: vi.fn((arg) => ({ __thunk: "verifyEmail", arg })),
    verifyMagicLink: vi.fn((arg) => ({ __thunk: "verifyMagicLink", arg })),
    clearMessages: vi.fn(() => ({ type: "auth/clearMessages" })),
}));

vi.mock("../../shared/constants/images", () => ({
    IMAGES: { logo: "logo.png", verifyHero: "hero.png" },
}));

vi.mock("@/shared/components/FullScreenLoader", () => ({
    default: ({ message }) => <div data-testid="fs-loader">{message}</div>,
}));

describe("VerifyEmail", () => {
    let mockNavigate;
    let mockDispatch;
    let thunkResults;
    let searchParamsValue;

    const setThunkResult = (thunkName, value) => {
        thunkResults[thunkName] = value;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate = vi.fn();
        thunkResults = {};
        searchParamsValue = new URLSearchParams();

        mockDispatch = vi.fn().mockImplementation((action) => {
            if (action && action.__thunk && thunkResults[action.__thunk] !== undefined) {
                return Promise.resolve(thunkResults[action.__thunk]);
            }
            return Promise.resolve(action);
        });

        useNavigate.mockReturnValue(mockNavigate);
        useLocation.mockReturnValue({ state: null });
        useSearchParams.mockImplementation(() => [searchParamsValue, vi.fn()]);
        useDispatch.mockReturnValue(mockDispatch);
        useSelector.mockReturnValue({ loading: false, sending: false, error: null, successMsg: null });

        // Sensible defaults so any auto-triggered effect (e.g. auto-send OTP on
        // mount) doesn't blow up with "Cannot read properties of undefined"
        // when a given test doesn't care about that particular thunk's outcome.
        sendOtp.fulfilled = { match: () => true };
        verifyEmail.fulfilled = { match: () => true };
        verifyMagicLink.fulfilled = { match: () => true };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const fillOtp = (digits = "123456") => {
        digits.split("").forEach((digit, idx) => {
            fireEvent.change(document.getElementById(`secure-code-${idx}`), {
                target: { value: digit },
            });
        });
    };

    it("renders the email input when there is no location.state.email or query email", () => {
        render(<VerifyEmail />);
        expect(screen.getByText("Verify your email")).toBeInTheDocument();
        expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
        expect(
            screen.getByText((_, el) => el?.textContent === "Enter the 6-digit OTP sent to your email"),
        ).toBeInTheDocument();
    });

    it("hides the email input when location.state.email is present", () => {
        useLocation.mockReturnValue({ state: { email: "jane@x.com" } });
        render(<VerifyEmail />);
        expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument();
        expect(screen.getByText("jane@x.com")).toBeInTheDocument();
    });

    it("hides the email input when a query email param is present", () => {
        searchParamsValue = new URLSearchParams("email=q@x.com");
        render(<VerifyEmail />);
        expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument();
    });

    it("auto-sends OTP on mount when location.state.email is present", async () => {
        useLocation.mockReturnValue({ state: { email: "jane@x.com" } });
        sendOtp.fulfilled = { match: () => true };
        render(<VerifyEmail />);
        await waitFor(() => {
            expect(sendOtp).toHaveBeenCalledWith({ email: "jane@x.com" });
        });
    });

    it("does not auto-send OTP when a magic link token is present", async () => {
        searchParamsValue = new URLSearchParams("token=tok&email=jane@x.com");
        useLocation.mockReturnValue({ state: { email: "jane@x.com" } });
        verifyMagicLink.fulfilled = { match: () => true };
        render(<VerifyEmail />);
        await waitFor(() => {
            expect(verifyMagicLink).toHaveBeenCalled();
        });
        expect(sendOtp).not.toHaveBeenCalled();
    });

    it("shows an error when Resend OTP is clicked with no email entered", async () => {
        render(<VerifyEmail />);
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Resend OTP" }));
        });
        expect(screen.getByText("Please enter your email first.")).toBeInTheDocument();
        expect(sendOtp).not.toHaveBeenCalled();
    });

    it("sends OTP via Resend OTP when an email is entered", async () => {
        sendOtp.fulfilled = { match: () => true };
        render(<VerifyEmail />);
        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "manual@x.com" },
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Resend OTP" }));
        });
        expect(sendOtp).toHaveBeenCalledWith({ email: "manual@x.com" });
    });

    it("shows an error banner when Resend OTP fails", async () => {
        sendOtp.fulfilled = { match: () => false };
        setThunkResult("sendOtp", { payload: "Could not send OTP" });
        render(<VerifyEmail />);
        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "manual@x.com" },
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Resend OTP" }));
        });
        expect(screen.getByText("Could not send OTP")).toBeInTheDocument();
    });

    it("falls back to the generic OTP failure message when payload is empty", async () => {
        sendOtp.fulfilled = { match: () => false };
        setThunkResult("sendOtp", { payload: null });
        render(<VerifyEmail />);
        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "manual@x.com" },
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Resend OTP" }));
        });
        expect(screen.getByText("Failed to send OTP.")).toBeInTheDocument();
    });

    it("shows the sending state on the Resend OTP button", () => {
        useSelector.mockReturnValue({ loading: false, sending: true, error: null, successMsg: null });
        render(<VerifyEmail />);
        expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    });

    it("hides the hero image on error", () => {
        render(<VerifyEmail />);
        const img = screen.getByAltText("A mentor and mentee in a professional setting");
        fireEvent.error(img);
        expect(img.style.display).toBe("none");
    });

    it("navigates to /login when Back to Login is clicked", () => {
        render(<VerifyEmail />);
        fireEvent.click(screen.getByText("Back to Login"));
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("shows a redux error via the root error banner", () => {
        useSelector.mockReturnValue({ loading: false, sending: false, error: "Some redux error", successMsg: null });
        render(<VerifyEmail />);
        expect(screen.getByText("Some redux error")).toBeInTheDocument();
    });

    it("shows a success message banner", () => {
        useSelector.mockReturnValue({ loading: false, sending: false, error: null, successMsg: "All good" });
        render(<VerifyEmail />);
        expect(screen.getByText("All good")).toBeInTheDocument();
    });

    it("shows the loading state on submit button", () => {
        useSelector.mockReturnValue({ loading: true, sending: false, error: null, successMsg: null });
        render(<VerifyEmail />);
        expect(screen.getByRole("button", { name: "Verifying..." })).toBeDisabled();
    });

    it("captures digits typed into the OTP boxes and moves focus forward", () => {
        render(<VerifyEmail />);
        const box0 = document.getElementById("secure-code-0");
        fireEvent.change(box0, { target: { value: "5" } });
        expect(box0.value).toBe("5");
        expect(document.activeElement.id).toBe("secure-code-1");
    });

    it("ignores non-digit input in OTP boxes", () => {
        render(<VerifyEmail />);
        const box0 = document.getElementById("secure-code-0");
        fireEvent.change(box0, { target: { value: "a" } });
        expect(box0.value).toBe("");
    });

    it("moves focus back on Backspace when the current box is empty", () => {
        render(<VerifyEmail />);
        const box1 = document.getElementById("secure-code-1");
        box1.focus();
        fireEvent.keyDown(box1, { key: "Backspace" });
        expect(document.activeElement.id).toBe("secure-code-0");
    });

    it("does not move focus back on Backspace at index 0", () => {
        render(<VerifyEmail />);
        const box0 = document.getElementById("secure-code-0");
        box0.focus();
        fireEvent.keyDown(box0, { key: "Backspace" });
        expect(document.activeElement.id).toBe("secure-code-0");
    });

    it("fills all OTP boxes on a valid 6-digit paste", () => {
        render(<VerifyEmail />);
        const box0 = document.getElementById("secure-code-0");
        const clipboardData = { getData: () => "123456" };
        fireEvent.paste(box0, { clipboardData });
        expect(box0.value).toBe("1");
        expect(document.getElementById("secure-code-5").value).toBe("6");
    });

    it("ignores paste payloads that are not exactly 6 digits", () => {
        render(<VerifyEmail />);
        const box0 = document.getElementById("secure-code-0");
        const clipboardData = { getData: () => "12a" };
        fireEvent.paste(box0, { clipboardData });
        expect(box0.value).toBe("");
    });

    it("shows a field-level email validation error when the email is left empty", async () => {
        render(<VerifyEmail />);
        fillOtp("123456");
        await act(async () => {
            fireEvent.submit(screen.getByRole("button", { name: "Verify Email" }));
        });
        expect(screen.getByText("Email is required.")).toBeInTheDocument();
        expect(verifyEmail).not.toHaveBeenCalled();
    });

    it("does not submit when the OTP is incomplete (schema validation)", async () => {
        render(<VerifyEmail />);
        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "jane@x.com" },
        });
        fillOtp("123");
        await act(async () => {
            fireEvent.submit(screen.getByRole("button", { name: "Verify Email" }));
        });
        expect(verifyEmail).not.toHaveBeenCalled();
    });

    it("submits, redirects on success after the timeout", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        verifyEmail.fulfilled = { match: () => true };
        render(<VerifyEmail />);
        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "jane@x.com" },
        });
        fillOtp("123456");
        await act(async () => {
            fireEvent.submit(screen.getByRole("button", { name: "Verify Email" }));
        });
        expect(verifyEmail).toHaveBeenCalledWith({ email: "jane@x.com", otp: "123456" });
        expect(screen.getByTestId("fs-loader")).toBeInTheDocument();
        act(() => {
            vi.advanceTimersByTime(900);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("shows a server error banner when verifyEmail is rejected", async () => {
        verifyEmail.fulfilled = { match: () => false };
        setThunkResult("verifyEmail", { payload: "Invalid OTP" });
        render(<VerifyEmail />);
        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "jane@x.com" },
        });
        fillOtp("123456");
        await act(async () => {
            fireEvent.submit(screen.getByRole("button", { name: "Verify Email" }));
        });
        expect(screen.getByText("Invalid OTP")).toBeInTheDocument();
    });

    it("falls back to the generic verification failure message", async () => {
        verifyEmail.fulfilled = { match: () => false };
        setThunkResult("verifyEmail", { payload: null });
        render(<VerifyEmail />);
        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "jane@x.com" },
        });
        fillOtp("123456");
        await act(async () => {
            fireEvent.submit(screen.getByRole("button", { name: "Verify Email" }));
        });
        expect(screen.getByText("OTP verification failed.")).toBeInTheDocument();
    });

    it("auto-verifies via magic link and redirects to /login after the timeout", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        searchParamsValue = new URLSearchParams("token=tok123&email=magic@x.com");
        verifyMagicLink.fulfilled = { match: () => true };
        render(<VerifyEmail />);

        expect(screen.getByText("Verifying your magic link, please wait...")).toBeInTheDocument();

        await waitFor(() => {
            expect(verifyMagicLink).toHaveBeenCalledWith({ token: "tok123", email: "magic@x.com" });
        });

        await waitFor(() => {
            expect(screen.getByTestId("fs-loader")).toBeInTheDocument();
        });

        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("shows an error banner when magic link verification fails", async () => {
        searchParamsValue = new URLSearchParams("token=tok123&email=magic@x.com");
        verifyMagicLink.fulfilled = { match: () => false };
        setThunkResult("verifyMagicLink", { payload: "Bad magic link" });
        render(<VerifyEmail />);

        await waitFor(() => {
            expect(screen.getByText("Bad magic link")).toBeInTheDocument();
        });
    });

    it("falls back to the generic magic link failure message", async () => {
        searchParamsValue = new URLSearchParams("token=tok123&email=magic@x.com");
        verifyMagicLink.fulfilled = { match: () => false };
        setThunkResult("verifyMagicLink", { payload: null });
        render(<VerifyEmail />);

        await waitFor(() => {
            expect(screen.getByText("Magic link verification failed.")).toBeInTheDocument();
        });
    });
});