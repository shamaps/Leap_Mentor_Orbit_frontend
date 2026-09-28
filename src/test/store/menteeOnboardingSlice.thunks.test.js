import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));
vi.mock("../../shared/utils/axiosInstance", () => ({
    default: { post: mockPost },
}));

import { submitMenteeOnboarding } from "../../app/store/slices/menteeOnboardingSlice";

describe("submitMenteeOnboarding thunk", () => {
    beforeEach(() => vi.clearAllMocks());

    it("posts the submitted profile and resolves with response data", async () => {
        mockPost.mockResolvedValueOnce({ data: { message: "Profile saved" } });
        const action = await submitMenteeOnboarding({ currentRole: "Engineer" })(
            vi.fn(),
            () => ({}),
            undefined,
        );
        expect(mockPost).toHaveBeenCalledWith(
            "/mentee-profile",
            { currentRole: "Engineer" },
            {},
        );
        expect(action.type).toBe("menteeOnboarding/submit/fulfilled");
        expect(action.payload).toEqual({ message: "Profile saved" });
    });

    it("rejects with a mapped error message when the request fails", async () => {
        mockPost.mockRejectedValueOnce(new Error("network unavailable"));
        const action = await submitMenteeOnboarding({})(vi.fn(), () => ({}), undefined);
        expect(action.type).toBe("menteeOnboarding/submit/rejected");
        expect(action.payload).toBe("network unavailable");
    });
});
