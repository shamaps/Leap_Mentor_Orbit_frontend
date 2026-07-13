import { describe, it, expect, vi, beforeEach } from "vitest";
import axiosInstance from "../../utils/axiosInstance";
import { fetchIncomingRequests } from "../../store/slices/connectRequestsSlice";

vi.mock("../../utils/axiosInstance");

describe("connectRequestsSlice thunks", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fetchIncomingRequests fulfills with res.data.requests", async () => {
        axiosInstance.get.mockResolvedValue({ data: { requests: [{ _id: "r1" }] } });
        const action = await fetchIncomingRequests()(vi.fn(), () => ({}), undefined);
        expect(axiosInstance.get).toHaveBeenCalledWith("/connect-requests/incoming");
        expect(action.type).toBe("connectRequests/fetchIncoming/fulfilled");
        expect(action.payload).toEqual([{ _id: "r1" }]);
    });

    it("fetchIncomingRequests defaults to [] when res.data.requests is absent", async () => {
        axiosInstance.get.mockResolvedValue({ data: {} });
        const action = await fetchIncomingRequests()(vi.fn(), () => ({}), undefined);
        expect(action.payload).toEqual([]);
    });

    it("fetchIncomingRequests rejects with a mapped error message on failure", async () => {
        axiosInstance.get.mockRejectedValue({ response: { status: 500 } });
        const action = await fetchIncomingRequests()(vi.fn(), () => ({}), undefined);
        expect(action.type).toBe("connectRequests/fetchIncoming/rejected");
        expect(action.payload).toBe("Something went wrong on our end. We've been notified — please try again shortly.");
    });
});