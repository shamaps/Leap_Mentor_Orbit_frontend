// src/test/components/mentor/dashboard/requests/ReferModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReferModal from "../../../../../features/mentor/view/components/dashboard/requests/ReferModal";

const { mockGetSimilarMentors, mockReferRequest } = vi.hoisted(() => ({
    mockGetSimilarMentors: vi.fn(),
    mockReferRequest: vi.fn(),
}));

vi.mock("../../../../../features/connects/model/connectRequests.api", () => ({
    getSimilarMentors: mockGetSimilarMentors,
    referRequest: mockReferRequest,
}));

const baseRequest = { _id: "req1", mentee: { name: "Jordan Lee", email: "jordan@example.com" } };

const mentorA = {
    _id: "m1",
    user: { _id: "u1", name: "Alex Kim" },
    currentRole: "Engineer",
    company: "Acme",
    skills: ["React", "Node"],
    avgRating: 4.2,
    profilePicture: null,
};
const mentorB = {
    _id: "m2",
    user: { _id: "u2", name: "Sam Patel" },
    currentRole: "Designer",
    company: "Beta",
    skills: ["Figma"],
    avgRating: 0,
    profilePicture: null,
};

describe("ReferModal Component Suite", () => {
    let onClose;
    let onReferred;

    beforeEach(() => {
        vi.clearAllMocks();
        onClose = vi.fn();
        onReferred = vi.fn();
    });

    const setup = (request = baseRequest) =>
        render(<ReferModal request={request} onClose={onClose} onReferred={onReferred} />);

    it("should show a loading state while fetching similar mentors", () => {
        mockGetSimilarMentors.mockReturnValue(new Promise(() => { }));
        setup();
        expect(screen.getByText("Finding similar mentors...")).toBeInTheDocument();
    });

    it("should show an empty state when no similar mentors are found", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [], mySkills: [] });
        setup();
        expect(await screen.findByText("No similar mentors found")).toBeInTheDocument();
    });

    it("should render the list of similar mentors once loaded", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [mentorA, mentorB], mySkills: ["React"] });
        setup();
        expect(await screen.findByText("Alex Kim")).toBeInTheDocument();
        expect(screen.getByText("Sam Patel")).toBeInTheDocument();
        expect(screen.getByText("2 mentors with similar skills")).toBeInTheDocument();
    });

    it("should show matching skills badges based on mySkills overlap", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [mentorA], mySkills: ["react"] });
        setup();
        await screen.findByText("Alex Kim");
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.queryByText("Node")).not.toBeInTheDocument();
    });

    it("should show an error message when fetching similar mentors fails", async () => {
        mockGetSimilarMentors.mockRejectedValue({
            response: { data: { message: "Could not load mentors" } },
        });
        setup();
        expect(await screen.findByText("Could not load mentors")).toBeInTheDocument();
    });

    it("should show a generic error message when the failure has no response message", async () => {
        mockGetSimilarMentors.mockRejectedValue(new Error("network down"));
        setup();
        expect(await screen.findByText("Failed to load similar mentors.")).toBeInTheDocument();
    });

    it("should disable the Refer Request button until a mentor is selected", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [mentorA], mySkills: [] });
        setup();
        await screen.findByText("Alex Kim");
        expect(screen.getByRole("button", { name: "Refer Request" })).toBeDisabled();

        fireEvent.click(screen.getByText("Alex Kim"));
        expect(screen.getByRole("button", { name: "Refer Request" })).toBeEnabled();
    });

    it("should call referRequest with the selected mentor's user id and show the success screen", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [mentorA], mySkills: [] });
        mockReferRequest.mockResolvedValue({});
        setup();
        await screen.findByText("Alex Kim");
        fireEvent.click(screen.getByText("Alex Kim"));
        fireEvent.click(screen.getByRole("button", { name: "Refer Request" }));

        await vi.waitFor(() => expect(mockReferRequest).toHaveBeenCalledWith("req1", "u1"));
        expect(await screen.findByText("Request Referred!")).toBeInTheDocument();
        expect(onReferred).toHaveBeenCalledWith("req1", "referred");
    });

    it("should show an error and stay on the mentor list when referRequest fails", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [mentorA], mySkills: [] });
        mockReferRequest.mockRejectedValue({ response: { data: { message: "Referral failed" } } });
        setup();
        await screen.findByText("Alex Kim");
        fireEvent.click(screen.getByText("Alex Kim"));
        fireEvent.click(screen.getByRole("button", { name: "Refer Request" }));

        expect(await screen.findByText("Referral failed")).toBeInTheDocument();
        expect(screen.queryByText("Request Referred!")).not.toBeInTheDocument();
    });

    it("should call onClose when Cancel is clicked", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [mentorA], mySkills: [] });
        setup();
        await screen.findByText("Alex Kim");
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onClose).toHaveBeenCalled();
    });

    it("should call onClose from the success screen's 'Back to Requests' button", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [mentorA], mySkills: [] });
        mockReferRequest.mockResolvedValue({});
        setup();
        await screen.findByText("Alex Kim");
        fireEvent.click(screen.getByText("Alex Kim"));
        fireEvent.click(screen.getByRole("button", { name: "Refer Request" }));
        await screen.findByText("Request Referred!");

        fireEvent.click(screen.getByRole("button", { name: "Back to Requests" }));
        expect(onClose).toHaveBeenCalled();
    });

    it("should re-fetch similar mentors when the request id changes", async () => {
        mockGetSimilarMentors.mockResolvedValue({ mentors: [], mySkills: [] });
        const { rerender } = setup(baseRequest);
        await vi.waitFor(() => expect(mockGetSimilarMentors).toHaveBeenCalledWith("req1"));

        rerender(<ReferModal request={{ _id: "req2", mentee: {} }} onClose={onClose} onReferred={onReferred} />);
        await vi.waitFor(() => expect(mockGetSimilarMentors).toHaveBeenCalledWith("req2"));
    });
});