// src/test/hooks/useMenteeDashboard.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchMenteeDashboard } from "../../store/slices/menteeProfileSlice";
import useMenteeDashboard from "../../hooks/useMenteeDashboard.jsx";

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
    menteeProfile: { user: { id: 1 }, profile: { bio: "hi" }, loading: false, error: null },
};

const setupSelectors = () => {
    useSelector.mockImplementation((selector) =>
        selector({
            auth: { token: mockState.token },
            menteeProfile: mockState.menteeProfile,
        }),
    );
};

describe("useMenteeDashboard", () => {
    let navigate;
    let dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        navigate = vi.fn();
        dispatch = vi.fn();
        useNavigate.mockReturnValue(navigate);
        useDispatch.mockReturnValue(dispatch);
        useLocation.mockReturnValue({ pathname: "/dashboard/mentee" });
        setupSelectors();
    });

    it("returns user/profile/loading/error from the selector", () => {
        dispatch.mockReturnValue(new Promise(() => { }));

        const { result } = renderHook(() => useMenteeDashboard());

        expect(result.current).toEqual({
            user: { id: 1 },
            profile: { bio: "hi" },
            loading: false,
            error: null,
        });
    });

    it("redirects to /login and skips fetching when there is no token", () => {
        mockState.token = null;
        setupSelectors();

        renderHook(() => useMenteeDashboard());

        expect(navigate).toHaveBeenCalledWith("/login");
        expect(dispatch).not.toHaveBeenCalled();

        mockState.token = "tok-123"; // restore for other tests
    });

    it("dispatches fetchMenteeDashboard only once even across re-renders", () => {
        dispatch.mockReturnValue(new Promise(() => { }));

        const { rerender } = renderHook(() => useMenteeDashboard());
        rerender();
        rerender();

        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it("navigates to /dashboard/mentor when rejected with reason 'wrong-role'", async () => {
        const rejectedAction = fetchMenteeDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "wrong-role" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("navigates to /onboarding/mentee when rejected with reason 'no-profile' and not on the edit page", async () => {
        const rejectedAction = fetchMenteeDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "no-profile" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/onboarding/mentee");
    });

    it("does not navigate on 'no-profile' rejection when already on the edit-profile page", async () => {
        useLocation.mockReturnValue({ pathname: "/dashboard/mentee/edit-profile" });
        const rejectedAction = fetchMenteeDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "no-profile" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("navigates to /login when rejected with reason 'unauthorized'", async () => {
        const rejectedAction = fetchMenteeDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "unauthorized" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/login");
    });

    it("does nothing further when rejected with an unhandled reason", async () => {
        const rejectedAction = fetchMenteeDashboard.rejected(
            new Error("x"),
            "reqId",
            undefined,
            { reason: "error", message: "boom" },
        );
        dispatch.mockResolvedValue(rejectedAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("navigates to /onboarding/mentee on fulfilled when profile is incomplete and not on edit page", async () => {
        const fulfilledAction = fetchMenteeDashboard.fulfilled(
            { user: { id: 1 }, profile: { isProfileComplete: false } },
            "reqId",
            undefined,
        );
        dispatch.mockResolvedValue(fulfilledAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).toHaveBeenCalledWith("/onboarding/mentee");
    });

    it("does not navigate on fulfilled when profile is complete", async () => {
        const fulfilledAction = fetchMenteeDashboard.fulfilled(
            { user: { id: 1 }, profile: { isProfileComplete: true } },
            "reqId",
            undefined,
        );
        dispatch.mockResolvedValue(fulfilledAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("does not navigate on fulfilled with incomplete profile when already on the edit-profile page", async () => {
        useLocation.mockReturnValue({ pathname: "/dashboard/mentee/edit-profile" });
        const fulfilledAction = fetchMenteeDashboard.fulfilled(
            { user: { id: 1 }, profile: { isProfileComplete: false } },
            "reqId",
            undefined,
        );
        dispatch.mockResolvedValue(fulfilledAction);

        renderHook(() => useMenteeDashboard());
        await Promise.resolve();
        await Promise.resolve();

        expect(navigate).not.toHaveBeenCalled();
    });
});