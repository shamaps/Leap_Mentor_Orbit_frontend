import { describe, it, expect, vi, beforeEach } from "vitest";
import axiosInstance from "../../utils/axiosInstance";
import { submitMentorOnboarding } from "../../store/slices/mentorOnboardingSlice";

vi.mock("../../utils/axiosInstance");

describe("submitMentorOnboarding thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("fulfills with res.data on success", async () => {
        axiosInstance.post.mockResolvedValue({ data: { ok: true } });
        const action = await submitMentorOnboarding({ bio: "x" })(vi.fn(), () => ({}), undefined);
        expect(axiosInstance.post).toHaveBeenCalledWith("/mentor-profile", { bio: "x" }, {});
        expect(action.type).toBe("mentorOnboarding/submit/fulfilled");
    });

    it("rejects with a mapped error message on failure", async () => {
        axiosInstance.post.mockRejectedValue({ response: { status: 500 } });
        const action = await submitMentorOnboarding({})(vi.fn(), () => ({}), undefined);
        expect(action.type).toBe("mentorOnboarding/submit/rejected");
    });
});