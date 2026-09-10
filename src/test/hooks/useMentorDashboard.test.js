// src/test/hooks/useMentorDashboard.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
    fetchMentorDashboard
} from "../../app/store/slices/mentorProfileSlice";
import useMentorDashboard from "../../features/mentor/presenter/useMentorDashboard";

vi.mock("react-redux", () => ({
    useDispatch: vi.fn(),
    useSelector: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
}));

const mockState = {
    token: "tok-123",
    mentorProfile: { user: { id: 1 }, profile: { bio: "hi" }, loading: false, error: null },
};

const setupSelectors = () => {
    useSelector.mockImplementation((selector) =>
        selector({
            auth: { token: mockState.token },
            mentorProfile: mockState.mentorProfile,
        }),
    );
};

describe("useMentorDashboard", () => {
    let navigate;
    let dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        navigate = vi.fn();
        dispatch = vi.fn();
        useNavigate.mockReturnValue(navigate);
        useDispatch.mockReturnValue(dispatch);
        useLocation.mockReturnValue({ pathname: "/dashboard/mentor" });
        setupSelectors();
    });

    it("returns user/profile/loading/error from the selector", () => {
        dispatch.mockReturnValue(new Promise(() => { }));

        const { result } = renderHook(() => useMentorDashboard());

        expect(result.current.user).toEqual({ id: 1 });
        expect(result.current.profile).toEqual({ bio: "hi" });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("redirects to /login/mentor and skips fetching when there is no token", () => {
        mockState.token = null;
        setupSelectors();

        renderHook(() => useMentorDashboard());

        expect(navigate).toHaveBeenCalledWith("/login/mentor");
        expect(dispatch).not.toHaveBeenCalled();

        mockState.token = "tok-123";
    });

    it("dispatches fetchMentorDashboard only once even across re-renders", () => {
        dispatch.mockReturnValue(new Promise(() => { }));

        const { rerender } = renderHook(() => useMentorDashboard());
        rerender();
        rerender();

        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it("navigates to /dashboard/mentee when rejected with reason 'wrong-role'", async () => {
        const rejectedAction = fetchMentorDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "wrong-role" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("navigates to /onboarding/mentor when rejected with reason 'no-profile' and not on the edit page", async () => {
        const rejectedAction = fetchMentorDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "no-profile" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/onboarding/mentor");
    });

    it("does not navigate on 'no-profile' rejection when already on the edit-profile page", async () => {
        useLocation.mockReturnValue({ pathname: "/dashboard/mentor/edit-profile" });
        const rejectedAction = fetchMentorDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "no-profile" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("navigates to /login/mentor when rejected with reason 'unauthorized'", async () => {
        const rejectedAction = fetchMentorDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "unauthorized" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/login/mentor");
    });

    it("does nothing further when rejected with reason 'error'", async () => {
        const rejectedAction = fetchMentorDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "error", message: "boom" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("navigates to /onboarding/mentor on fulfilled when profile is incomplete and not on edit page", async () => {
        const fulfilledAction = fetchMentorDashboard.fulfilled(
            { user: { id: 1 }, profile: { isProfileComplete: false } },
            "reqId",
            undefined,
        );
        dispatch.mockResolvedValue(fulfilledAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/onboarding/mentor");
    });

    it("does not navigate on fulfilled when profile is complete", async () => {
        const fulfilledAction = fetchMentorDashboard.fulfilled(
            { user: { id: 1 }, profile: { isProfileComplete: true } },
            "reqId",
            undefined,
        );
        dispatch.mockResolvedValue(fulfilledAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("does not navigate on fulfilled with incomplete profile when already on the edit-profile page", async () => {
        useLocation.mockReturnValue({ pathname: "/dashboard/mentor/edit-profile" });
        const fulfilledAction = fetchMentorDashboard.fulfilled(
            { user: { id: 1 }, profile: { isProfileComplete: false } },
            "reqId",
            undefined,
        );
        dispatch.mockResolvedValue(fulfilledAction);

        renderHook(() => useMentorDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("refetchProfile dispatches refetchMentorProfile()", () => {
        dispatch.mockReturnValue(new Promise(() => { }));

        const { result } = renderHook(() => useMentorDashboard());

        dispatch.mockClear();
        result.current.refetchProfile();

        expect(dispatch).toHaveBeenCalledTimes(1);
        const dispatchedArg = dispatch.mock.calls[0][0];
        expect(typeof dispatchedArg).toBe("function");
    });
});