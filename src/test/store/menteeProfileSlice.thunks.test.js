import { describe, it, expect, vi, beforeEach } from "vitest";
import axiosInstance from "../../utils/axiosInstance";
import { fetchMenteeDashboard } from "../../store/slices/menteeProfileSlice";

vi.mock("../../utils/axiosInstance");

const run = () => fetchMenteeDashboard()(vi.fn(), () => ({}), undefined);

describe("fetchMenteeDashboard thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fulfills with user + profile when both calls succeed and user has the mentee role", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentee"] } })
            .mockResolvedValueOnce({ data: { bio: "x" } });
        const action = await run();
        expect(action.type).toBe("menteeProfile/fetchMenteeDashboard/fulfilled");
        expect(action.payload).toEqual({ user: { roles: ["mentee"] }, profile: { bio: "x" } });
    });

    it("rejects with reason 'wrong-role' when the user lacks the mentee role", async () => {
        axiosInstance.get.mockResolvedValueOnce({ data: { roles: ["mentor"] } });
        const action = await run();
        expect(action.payload).toEqual({ reason: "wrong-role" });
    });

    it("rejects with reason 'no-profile' when the profile call 404s", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentee"] } })
            .mockRejectedValueOnce({ response: { status: 404 } });
        const action = await run();
        expect(action.payload).toEqual({ reason: "no-profile", user: { roles: ["mentee"] } });
    });

    it("rejects with reason 'unauthorized' when the nested profile call 401s", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentee"] } })
            .mockRejectedValueOnce({ response: { status: 401 } });
        const action = await run();
        expect(action.payload).toEqual({ reason: "unauthorized" });
    });

    it("rejects with reason 'error' when the nested profile call fails with an unhandled status", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { roles: ["mentee"] } })
            .mockRejectedValueOnce({ response: { status: 500 } });
        const action = await run();
        expect(action.payload.reason).toBe("error");
    });

    it("rejects with reason 'unauthorized' when the outer /users/me call itself 401s", async () => {
        axiosInstance.get.mockRejectedValueOnce({ response: { status: 401 } });
        const action = await run();
        expect(action.payload).toEqual({ reason: "unauthorized" });
    });

    it("rejects with reason 'error' when the outer call fails with an unhandled status", async () => {
        axiosInstance.get.mockRejectedValueOnce({ response: { status: 500 } });
        const action = await run();
        expect(action.payload.reason).toBe("error");
        expect(action.payload.message).toBeTruthy();
    });

    it("rejects with reason 'wrong-role' when clientUserData.roles is entirely absent", async () => {
        axiosInstance.get.mockResolvedValueOnce({ data: {} });
        const action = await run();
        expect(action.payload).toEqual({ reason: "wrong-role" });
    });
});