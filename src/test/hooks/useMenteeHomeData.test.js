// src/test/hooks/useMenteeHomeData.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { searchMentors } from "../../features/mentee/model/mentorSearch.api";
import { getMyRequests } from "../../features/connects/model/connectRequests.api";
import { getWallet } from "../../features/shared-dashboard/model/escrow.api";
import logger from "../../shared/utils/logger";
import { useMenteeHomeData } from "../../features/mentee/presenter/useMenteeHomeData";

vi.mock("../../features/mentee/model/mentorSearch.api");
vi.mock("../../features/connects/model/connectRequests.api");
vi.mock("../../features/shared-dashboard/model/escrow.api");
vi.mock("../../shared/utils/logger");

describe("useMenteeHomeData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        searchMentors.mockResolvedValue({ mentors: [] });
        getMyRequests.mockResolvedValue({ requests: [] });
        getWallet.mockResolvedValue({ balance: 0, escrow: 0 });
    });

    it("does not fetch anything when profile is null", () => {
        renderHook(() => useMenteeHomeData(null));

        expect(searchMentors).not.toHaveBeenCalled();
        expect(getMyRequests).not.toHaveBeenCalled();
        expect(getWallet).not.toHaveBeenCalled();
    });

    it("fetches mentors using the first skill as the search term", async () => {
        searchMentors.mockResolvedValue({ mentors: [{ id: "m1" }] });

        const { result } = renderHook(() =>
            useMenteeHomeData({ skills: ["React", "Node"] }),
        );

        await waitFor(() => expect(result.current.loadingMentors).toBe(false));

        expect(searchMentors).toHaveBeenCalledWith({ skill: "React", limit: 4 });
        expect(result.current.mentors).toEqual([{ id: "m1" }]);
    });

    it("falls back to interestedFields when skills is empty", async () => {
        renderHook(() =>
            useMenteeHomeData({ skills: [], interestedFields: ["Data Science"] }),
        );

        await waitFor(() =>
            expect(searchMentors).toHaveBeenCalledWith({ skill: "Data Science", limit: 4 }),
        );
    });

    it("uses an empty skill term when neither skills nor interestedFields exist", async () => {
        renderHook(() => useMenteeHomeData({}));

        await waitFor(() =>
            expect(searchMentors).toHaveBeenCalledWith({ skill: "", limit: 4 }),
        );
    });

    it("defaults mentors to an empty array when the response has none", async () => {
        searchMentors.mockResolvedValue({});

        const { result } = renderHook(() => useMenteeHomeData({ skills: ["X"] }));

        await waitFor(() => expect(result.current.loadingMentors).toBe(false));

        expect(result.current.mentors).toEqual([]);
    });

    it("logs an error and stops loading when the mentor fetch fails", async () => {
        searchMentors.mockRejectedValue(new Error("mentor search down"));

        const { result } = renderHook(() => useMenteeHomeData({ skills: ["X"] }));

        await waitFor(() => expect(result.current.loadingMentors).toBe(false));

        expect(logger.error).toHaveBeenCalledWith("Mentor search fetch failed", {
            message: "mentor search down",
        });
        expect(result.current.mentors).toEqual([]);
    });

    it("filters sessions to only accepted/ongoing and sorts ongoing first", async () => {
        getMyRequests.mockResolvedValue({
            requests: [
                { id: "r1", status: "accepted" },
                { id: "r2", status: "ongoing" },
                { id: "r3", status: "rejected" },
                { id: "r4", status: "pending" },
            ],
        });

        const { result } = renderHook(() => useMenteeHomeData({ skills: ["X"] }));

        await waitFor(() => expect(result.current.loadingSessions).toBe(false));

        expect(result.current.sessions).toEqual([
            { id: "r2", status: "ongoing" },
            { id: "r1", status: "accepted" },
        ]);
    });

    it("logs an error and stops loading when the sessions fetch fails", async () => {
        getMyRequests.mockRejectedValue(new Error("sessions down"));

        const { result } = renderHook(() => useMenteeHomeData({ skills: ["X"] }));

        await waitFor(() => expect(result.current.loadingSessions).toBe(false));

        expect(logger.error).toHaveBeenCalledWith("Sessions fetch failed", {
            message: "sessions down",
        });
        expect(result.current.sessions).toEqual([]);
    });

    it("sets balance and escrow from the wallet response", async () => {
        getWallet.mockResolvedValue({ balance: 250, escrow: 50 });

        const { result } = renderHook(() => useMenteeHomeData({ skills: ["X"] }));

        await waitFor(() => expect(result.current.loadingWallet).toBe(false));

        expect(result.current.balance).toBe(250);
        expect(result.current.escrow).toBe(50);
    });

    it("defaults balance and escrow to 0 when missing from the response", async () => {
        getWallet.mockResolvedValue({});

        const { result } = renderHook(() => useMenteeHomeData({ skills: ["X"] }));

        await waitFor(() => expect(result.current.loadingWallet).toBe(false));

        expect(result.current.balance).toBe(0);
        expect(result.current.escrow).toBe(0);
    });

    it("logs an error and stops loading when the wallet fetch fails", async () => {
        getWallet.mockRejectedValue(new Error("wallet down"));

        const { result } = renderHook(() => useMenteeHomeData({ skills: ["X"] }));

        await waitFor(() => expect(result.current.loadingWallet).toBe(false));

        expect(logger.error).toHaveBeenCalledWith("Wallet fetch failed", {
            message: "wallet down",
        });
        expect(result.current.balance).toBe(0);
    });

    it("refetches all three when profile changes", async () => {
        const { rerender } = renderHook(({ p }) => useMenteeHomeData(p), {
            initialProps: { p: { skills: ["React"] } },
        });

        await waitFor(() => expect(searchMentors).toHaveBeenCalledTimes(1));

        rerender({ p: { skills: ["Java"] } });

        await waitFor(() => expect(searchMentors).toHaveBeenCalledTimes(2));
        expect(searchMentors).toHaveBeenLastCalledWith({ skill: "Java", limit: 4 });
        expect(getMyRequests).toHaveBeenCalledTimes(2);
        expect(getWallet).toHaveBeenCalledTimes(2);
    });
});