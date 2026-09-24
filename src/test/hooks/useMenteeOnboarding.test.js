// src/test/hooks/useMenteeOnboarding.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    submitMenteeOnboarding,
    clearOnboardingMessages,
} from "../../app/store/slices/menteeOnboardingSlice";
import { getFirstErrorMessage } from "../../features/mentee/schemas/onboardingSchemas";
import { sessionStore } from "../../shared/utils/storage";
import useMenteeOnboarding from "../../features/mentee/presenter/useMenteeOnboarding";

vi.mock("react-router-dom");
vi.mock("react-redux");
vi.mock("../../app/store/slices/menteeOnboardingSlice", () => ({
    submitMenteeOnboarding: vi.fn((payload) => ({ type: "submitMenteeOnboarding", payload })),
    clearOnboardingMessages: vi.fn(() => ({ type: "clearOnboardingMessages" })),
}));
vi.mock("../../features/mentee/schemas/onboardingSchemas", () => ({
    menteeOnboardingSchema: {},
    getFirstErrorMessage: vi.fn(),
}));
vi.mock("../../shared/utils/storage", () => ({
    sessionStore: {
        getJSON: vi.fn(),
        setJSON: vi.fn(),
        remove: vi.fn(),
    },
}));

const buildState = ({ loading = false, error = null, successMsg = null, token = "tok" } = {}) => ({
    auth: { token },
    menteeOnboarding: { loading, error, successMsg },
});

describe("useMenteeOnboarding", () => {
    let navigate;
    let dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        navigate = vi.fn();
        dispatch = vi.fn();
        useNavigate.mockReturnValue(navigate);
        useDispatch.mockReturnValue(dispatch);
        getFirstErrorMessage.mockReturnValue(null);
        sessionStore.getJSON.mockReturnValue(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockState = (state) => {
        useSelector.mockImplementation((selector) => selector(state));
    };

    it("initializes form from sessionStorage when a saved draft exists", () => {
        const savedForm = { currentRole: "Dev", bio: "Saved bio" };
        sessionStore.getJSON.mockReturnValue(savedForm);
        mockState(buildState());

        const { result } = renderHook(() => useMenteeOnboarding());

        expect(result.current.form).toEqual(savedForm);
    });

    it("initializes with the empty form when there is no saved draft", () => {
        mockState(buildState());

        const { result } = renderHook(() => useMenteeOnboarding());

        expect(result.current.form.currentRole).toBe("");
        expect(result.current.form.skills).toEqual([]);
    });

    it("persists form changes to sessionStorage", () => {
        mockState(buildState());
        const { result } = renderHook(() => useMenteeOnboarding());

        act(() => {
            result.current.handleChange({ target: { name: "bio", value: "New bio" } });
        });

        expect(sessionStore.setJSON).toHaveBeenCalledWith(
            "menteeOnboardingForm",
            expect.objectContaining({ bio: "New bio" }),
        );
    });

    it("surfaces a redux error into local msg state", () => {
        mockState(buildState({ error: "Server rejected onboarding" }));

        const { result } = renderHook(() => useMenteeOnboarding());

        expect(result.current.msg).toEqual({
            type: "error",
            text: "Server rejected onboarding",
        });
    });

    it("on success: clears the draft, dispatches clearOnboardingMessages, and navigates after a delay", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockState(buildState({ successMsg: "Onboarding complete" }));

        const { result } = renderHook(() => useMenteeOnboarding());

        expect(sessionStore.remove).toHaveBeenCalledWith("menteeOnboardingForm");
        expect(dispatch).toHaveBeenCalledWith(clearOnboardingMessages());
        expect(result.current.redirecting).toBe(true);
        expect(navigate).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(1500);
        });

        expect(navigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("dispatches clearOnboardingMessages on unmount", () => {
        mockState(buildState());
        const { unmount } = renderHook(() => useMenteeOnboarding());

        dispatch.mockClear();
        unmount();

        expect(dispatch).toHaveBeenCalledWith(clearOnboardingMessages());
    });

    describe("handleSubmit", () => {
        const makeEvent = () => ({ preventDefault: vi.fn() });

        it("prevents default and shows an error when currentRole is empty", async () => {
            mockState(buildState());
            const { result } = renderHook(() => useMenteeOnboarding());

            const event = makeEvent();
            await act(async () => {
                await result.current.handleSubmit(event);
            });

            expect(event.preventDefault).toHaveBeenCalled();
            expect(result.current.msg).toEqual({
                type: "error",
                text: "Current Role is required.",
            });
            expect(submitMenteeOnboarding).not.toHaveBeenCalled();
        });

        it("redirects to /login when there is no auth token", async () => {
            mockState(buildState({ token: null }));
            const { result } = renderHook(() => useMenteeOnboarding());

            act(() => {
                result.current.handleChange({ target: { name: "currentRole", value: "Dev" } });
            });

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(navigate).toHaveBeenCalledWith("/login");
            expect(submitMenteeOnboarding).not.toHaveBeenCalled();
        });

        it("shows a validation error from the schema without dispatching", async () => {
            mockState(buildState());
            getFirstErrorMessage.mockReturnValue("Bio is too short.");
            const { result } = renderHook(() => useMenteeOnboarding());

            act(() => {
                result.current.handleChange({ target: { name: "currentRole", value: "Dev" } });
            });

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(result.current.msg).toEqual({ type: "error", text: "Bio is too short." });
            expect(submitMenteeOnboarding).not.toHaveBeenCalled();
        });

        it("dispatches submitMenteeOnboarding with the form when validation passes", async () => {
            mockState(buildState());
            const { result } = renderHook(() => useMenteeOnboarding());

            act(() => {
                result.current.handleChange({ target: { name: "currentRole", value: "Dev" } });
            });

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(submitMenteeOnboarding).toHaveBeenCalledWith(
                expect.objectContaining({ currentRole: "Dev" }),
            );
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({ type: "submitMenteeOnboarding" }),
            );
        });
    });
});