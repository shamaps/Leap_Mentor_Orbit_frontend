import { describe, it, expect, vi, beforeEach } from "vitest";
import axiosInstance from "../../utils/axiosInstance";
import logger from "../../utils/logger";
import { logoutUser } from "../../store/slices/authSlice";
import {
    fetchMentorDashboard,
    refetchMentorProfile,
} from "../../store/slices/mentorProfileSlice";

vi.mock("../../utils/axiosInstance");
vi.mock("../../utils/logger");
vi.mock("../../store/slices/authSlice", async () => {
    const actual = await vi.importActual("../../store/slices/authSlice");
    return { ...actual, logoutUser: vi.fn(() => ({ type: "auth/logoutUser/pending" })) };
});

const run = () => fetchMentorDashboard()(vi.fn(), () => ({}), undefined);

describe("fetchMentorDashboard thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fulfills with user + profile when the user has the mentor role", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentor"] } })
            .mockResolvedValueOnce({ data: { bio: "x" } });
        const action = await run();
        expect(action.type).toBe("mentorProfile/fetchMentorDashboard/fulfilled");
        expect(action.payload).toEqual({ user: { roles: ["mentor"] }, profile: { bio: "x" } });
    });

    it("rejects with reason 'wrong-role' when the user lacks the mentor role", async () => {
        axiosInstance.get.mockResolvedValueOnce({ data: { roles: ["mentee"] } });
        const action = await run();
        expect(action.payload).toEqual({ reason: "wrong-role" });
    });

    it("rejects with reason 'no-profile' when the nested profile call 404s", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentor"] } })
            .mockRejectedValueOnce({ response: { status: 404 } });
        const action = await run();
        expect(action.payload).toEqual({ reason: "no-profile", user: { roles: ["mentor"] } });
    });

    it("triggers deauth cleanup (dispatches logoutUser) when the nested profile call 401s", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentor"] } })
            .mockRejectedValueOnce({ response: { status: 401 } });
        const dispatch = vi.fn();
        const action = await fetchMentorDashboard()(dispatch, () => ({}), undefined);
        expect(dispatch).toHaveBeenCalledWith({ type: "auth/logoutUser/pending" });
        expect(action.payload).toEqual({ reason: "unauthorized" });
    });

    it("rejects with reason 'error' when the nested call fails with an unhandled status", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentor"] } })
            .mockRejectedValueOnce({ response: { status: 500 } });
        const action = await run();
        expect(action.payload.reason).toBe("error");
    });

    it("triggers deauth cleanup when the outer /users/me call itself 401s", async () => {
        axiosInstance.get.mockRejectedValueOnce({ response: { status: 401 } });
        const dispatch = vi.fn();
        const action = await fetchMentorDashboard()(dispatch, () => ({}), undefined);
        expect(dispatch).toHaveBeenCalledWith({ type: "auth/logoutUser/pending" });
        expect(action.payload).toEqual({ reason: "unauthorized" });
    });

    it("rejects with reason 'error' when the outer call fails with an unhandled status", async () => {
        axiosInstance.get.mockRejectedValueOnce({ response: { status: 500 } });
        const action = await run();
        expect(action.payload.reason).toBe("error");
    });
});

describe("refetchMentorProfile thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fulfills with res.data on success", async () => {
        axiosInstance.get.mockResolvedValue({ data: { bio: "updated" } });
        const action = await refetchMentorProfile()(vi.fn(), () => ({}), undefined);
        expect(action.type).toBe("mentorProfile/refetchMentorProfile/fulfilled");
        expect(action.payload).toEqual({ bio: "updated" });
    });

    it("logs and rejects with a mapped error message on failure", async () => {
        axiosInstance.get.mockRejectedValue({ message: "network error", response: undefined });
        const action = await refetchMentorProfile()(vi.fn(), () => ({}), undefined);
        expect(logger.error).toHaveBeenCalledWith("Profile refetch failed", { message: "network error" });
        expect(action.type).toBe("mentorProfile/refetchMentorProfile/rejected");
        expect(action.payload).toBe("network error");
    });
});