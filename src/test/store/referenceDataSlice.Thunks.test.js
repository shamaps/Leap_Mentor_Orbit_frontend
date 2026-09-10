import { describe, it, expect, vi, beforeEach } from "vitest";
import axiosInstance from "../../shared/utils/axiosInstance";
import { fetchMentorIndustries, fetchMentorList } from "../../app/store/slices/referenceDataSlice";

vi.mock("../../shared/utils/axiosInstance");

describe("fetchMentorIndustries thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fetches and returns data when the cache is empty", async () => {
        axiosInstance.get.mockResolvedValue({ data: { data: ["Tech", "Finance"] } });
        const getState = () => ({ referenceData: { industries: [], lastFetchedAt: null } });
        const action = await fetchMentorIndustries()(vi.fn(), getState, undefined);
        expect(action.type).toBe("referenceData/fetchMentorIndustries/fulfilled");
        expect(action.payload).toEqual(["Tech", "Finance"]);
    });

    it("returns null without calling the API when the cache is still fresh", async () => {
        const getState = () => ({
            referenceData: { industries: ["Tech"], lastFetchedAt: Date.now() },
        });
        const action = await fetchMentorIndustries()(vi.fn(), getState, undefined);
        expect(axiosInstance.get).not.toHaveBeenCalled();
        expect(action.payload).toBeNull();
    });

    it("fetches again when the cache is stale (older than 10 minutes)", async () => {
        axiosInstance.get.mockResolvedValue({ data: { data: ["Tech"] } });
        const getState = () => ({
            referenceData: { industries: ["Old"], lastFetchedAt: Date.now() - 11 * 60 * 1000 },
        });
        const action = await fetchMentorIndustries()(vi.fn(), getState, undefined);
        expect(axiosInstance.get).toHaveBeenCalled();
        expect(action.payload).toEqual(["Tech"]);
    });

    it("rejects using response.data.message on failure", async () => {
        axiosInstance.get.mockRejectedValue({ response: { data: { message: "Boom" } } });
        const getState = () => ({ referenceData: { industries: [], lastFetchedAt: null } });
        const action = await fetchMentorIndustries()(vi.fn(), getState, undefined);
        expect(action.payload).toBe("Boom");
    });

    it("rejects with the default message when response.data.message is absent", async () => {
        axiosInstance.get.mockRejectedValue({});
        const getState = () => ({ referenceData: { industries: [], lastFetchedAt: null } });
        const action = await fetchMentorIndustries()(vi.fn(), getState, undefined);
        expect(action.payload).toBe("Failed to fetch industries");
    });
});

describe("fetchMentorList thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fetches with default page/limit when called with no argument", async () => {
        axiosInstance.get.mockResolvedValue({ data: { data: { mentors: [], pagination: null } } });
        const getState = () => ({ referenceData: { mentorList: [], mentorListFetchedAt: null } });
        const action = await fetchMentorList()(vi.fn(), getState, undefined);
        expect(axiosInstance.get).toHaveBeenCalledWith("/mentors?page=1&limit=6");
        expect(action.type).toBe("referenceData/fetchMentorList/fulfilled");
    });

    it("fetches with explicit page/limit when provided", async () => {
        axiosInstance.get.mockResolvedValue({ data: { data: { mentors: [], pagination: null } } });
        const getState = () => ({ referenceData: { mentorList: [], mentorListFetchedAt: null } });
        await fetchMentorList({ page: 2, limit: 10 })(vi.fn(), getState, undefined);
        expect(axiosInstance.get).toHaveBeenCalledWith("/mentors?page=2&limit=10");
    });

    it("returns null without calling the API when the cache is still fresh", async () => {
        const getState = () => ({
            referenceData: { mentorList: [{ id: "m1" }], mentorListFetchedAt: Date.now() },
        });
        const action = await fetchMentorList()(vi.fn(), getState, undefined);
        expect(axiosInstance.get).not.toHaveBeenCalled();
        expect(action.payload).toBeNull();
    });

    it("rejects using response.data.message on failure", async () => {
        axiosInstance.get.mockRejectedValue({ response: { data: { message: "Nope" } } });
        const getState = () => ({ referenceData: { mentorList: [], mentorListFetchedAt: null } });
        const action = await fetchMentorList()(vi.fn(), getState, undefined);
        expect(action.payload).toBe("Nope");
    });

    it("rejects with the default message when response.data.message is absent", async () => {
        axiosInstance.get.mockRejectedValue({});
        const getState = () => ({ referenceData: { mentorList: [], mentorListFetchedAt: null } });
        const action = await fetchMentorList()(vi.fn(), getState, undefined);
        expect(action.payload).toBe("Failed to fetch mentors");
    });
});