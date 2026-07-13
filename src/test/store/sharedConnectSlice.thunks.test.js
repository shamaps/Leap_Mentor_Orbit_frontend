import { describe, it, expect, vi, beforeEach } from "vitest";
import axiosInstance from "../../utils/axiosInstance";
import { fetchSharedConnect } from "../../store/slices/sharedConnectSlice";

vi.mock("../../utils/axiosInstance");

const run = (id) => fetchSharedConnect(id)(vi.fn(), () => ({}), undefined);

describe("fetchSharedConnect thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fulfills using res.data.connect when present", async () => {
        axiosInstance.get.mockResolvedValue({ data: { connect: { id: "c1" } } });
        const action = await run("c1");
        expect(axiosInstance.get).toHaveBeenCalledWith("/connect-requests/c1/detail");
        expect(action.payload).toEqual({ id: "c1" });
    });

    it("falls back to res.data itself when res.data.connect is absent", async () => {
        axiosInstance.get.mockResolvedValue({ data: { id: "c1", status: "confirmed" } });
        const action = await run("c1");
        expect(action.payload).toEqual({ id: "c1", status: "confirmed" });
    });

    it("rejects with reason 'unauthorized' on 401", async () => {
        axiosInstance.get.mockRejectedValue({ response: { status: 401 } });
        const action = await run("c1");
        expect(action.payload).toEqual({ reason: "unauthorized" });
    });

    it("rejects with reason 'forbidden' on 403", async () => {
        axiosInstance.get.mockRejectedValue({ response: { status: 403 } });
        const action = await run("c1");
        expect(action.payload).toEqual({ reason: "forbidden" });
    });

    it("rejects with reason 'error' and a mapped message on any other failure", async () => {
        axiosInstance.get.mockRejectedValue({ response: { status: 500 } });
        const action = await run("c1");
        expect(action.payload.reason).toBe("error");
        expect(action.payload.message).toBeTruthy();
    });
});