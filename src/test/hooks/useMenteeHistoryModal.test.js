import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const { mockGetMenteeEngagements, mockWarn } = vi.hoisted(() => ({
  mockGetMenteeEngagements: vi.fn(),
  mockWarn: vi.fn(),
}));
vi.mock("../../features/admin/model/admin.api", () => ({
  getMenteeEngagements: mockGetMenteeEngagements,
}));
vi.mock("../../shared/utils/logger", () => ({
  default: { warn: mockWarn },
}));

import { useMenteeHistoryModal } from "../../features/admin/presenter/useMenteeHistoryModal";

describe("useMenteeHistoryModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts empty and does not fetch without a mentee", async () => {
    const { result } = renderHook(() => useMenteeHistoryModal(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.engagements).toEqual([]);
    expect(mockGetMenteeEngagements).not.toHaveBeenCalled();
  });

  it("fetches engagements and filters by mentee id or email", async () => {
    const mentee = { _id: "m1", name: "Asha", email: "asha@example.com" };
    mockGetMenteeEngagements.mockResolvedValueOnce({ data: { engagements: [
      { _id: "id-match", mentee: { _id: "m1" } },
      { _id: "email-match", mentee: { email: "asha@example.com" } },
      { _id: "other", mentee: { _id: "m2", email: "other@example.com" } },
    ] } });
    const { result } = renderHook(() => useMenteeHistoryModal(mentee));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.engagements.map((item) => item._id)).toEqual(["id-match", "email-match"]);
    expect(mockGetMenteeEngagements).toHaveBeenCalledWith("Asha");

    act(() => result.current.toggleExpand("id-match"));
    expect(result.current.expandedId).toBe("id-match");
    act(() => result.current.toggleExpand("id-match"));
    expect(result.current.expandedId).toBeNull();
  });

  it("accepts legacy response shapes and logs request failures", async () => {
    mockGetMenteeEngagements.mockResolvedValueOnce({ data: [
      { _id: "id-match", mentee: { email: "asha@example.com" } },
    ] });
    const { result, rerender } = renderHook(({ mentee }) => useMenteeHistoryModal(mentee), {
      initialProps: { mentee: { _id: "m1", name: "Asha", email: "asha@example.com" } },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.engagements).toHaveLength(1);

    mockGetMenteeEngagements.mockRejectedValueOnce(new Error("offline"));
    rerender({ mentee: { _id: "m2", name: "Bea", email: "bea@example.com" } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockWarn).toHaveBeenCalledWith("Failed to fetch engagements", {
      message: expect.any(String),
    });
  });
});
