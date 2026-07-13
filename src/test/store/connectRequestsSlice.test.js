import { describe, it, expect } from "vitest";
import reducer, {
    updateRequestStatus,
    fetchIncomingRequests,
    selectIncomingRequests,
} from "../../store/slices/connectRequestsSlice";

describe("connectRequestsSlice", () => {
    const getInitial = () => reducer(undefined, { type: "@@INIT" });

    it("returns the initial state with loading/initialLoad true", () => {
        const state = getInitial();
        expect(state.loading).toBe(true);
        expect(state.initialLoad).toBe(true);
        expect(state.error).toBeNull();
        expect(state.ids).toEqual([]);
    });

    it("fetchIncomingRequests.pending sets loading and clears error", () => {
        const result = reducer(
            { ...getInitial(), error: "old" },
            { type: fetchIncomingRequests.pending.type },
        );
        expect(result.loading).toBe(true);
        expect(result.error).toBeNull();
    });

    it("fetchIncomingRequests.fulfilled populates entities and clears loading/initialLoad", () => {
        const payload = [{ _id: "r1", status: "pending" }, { _id: "r2", status: "pending" }];
        const result = reducer(getInitial(), {
            type: fetchIncomingRequests.fulfilled.type,
            payload,
        });
        expect(result.loading).toBe(false);
        expect(result.initialLoad).toBe(false);
        expect(selectIncomingRequests({ connectRequests: result })).toHaveLength(2);
    });

    it("fetchIncomingRequests.rejected sets the error message from payload", () => {
        const result = reducer(getInitial(), {
            type: fetchIncomingRequests.rejected.type,
            payload: "Failed to load requests.",
        });
        expect(result.error).toBe("Failed to load requests.");
        expect(result.loading).toBe(false);
    });

    it("fetchIncomingRequests.rejected falls back to a default message when payload is absent", () => {
        const result = reducer(getInitial(), { type: fetchIncomingRequests.rejected.type });
        expect(result.error).toBe("Failed to load requests.");
    });

    it("updateRequestStatus updates status and sets respondedAt on the matching entity", () => {
        const withData = reducer(getInitial(), {
            type: fetchIncomingRequests.fulfilled.type,
            payload: [{ _id: "r1", status: "pending" }],
        });
        const result = reducer(withData, updateRequestStatus({ id: "r1", newStatus: "accepted" }));
        const [request] = selectIncomingRequests({ connectRequests: result });
        expect(request.status).toBe("accepted");
        expect(request.respondedAt).toBeTruthy();
    });
});