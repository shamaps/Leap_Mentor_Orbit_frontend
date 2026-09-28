import { describe, it, expect } from "vitest";
import {
  ELIGIBLE_BADGES_CONFIG,
  formatTime,
  MAX_SLOTS,
  SLOT_DOT_KEYS,
} from "../../../../../features/mentee/view/components/dashboard/findMentors/MentorProfileModal.constants";

describe("MentorProfileModal constants", () => {
  it("exposes the slot limits and dot styles", () => {
    expect(MAX_SLOTS).toBe(5);
    expect(SLOT_DOT_KEYS).toHaveLength(MAX_SLOTS);
  });

  it("evaluates each mentor badge at its threshold and handles missing values", () => {
    const verify = Object.fromEntries(ELIGIBLE_BADGES_CONFIG.map((badge) => [badge.id, badge.verify]));
    expect(verify.newcomer()).toBe(true);
    expect(verify.ten_sessions()).toBe(false);
    expect(verify.ten_sessions({ totalSessions: 10 })).toBe(true);
    expect(verify.top_rated()).toBe(false);
    expect(verify.top_rated({ avgRating: 4.5 })).toBe(true);
    expect(verify.expert_guide({ totalSessions: 49 })).toBe(false);
    expect(verify.expert_guide({ totalSessions: 50 })).toBe(true);
  });

  it("formats absent, morning, noon, and afternoon times", () => {
    expect(formatTime()).toBe("");
    expect(formatTime("09:05")).toBe("09:05 AM");
    expect(formatTime("12:30")).toBe("12:30 PM");
    expect(formatTime("15:07")).toBe("03:07 PM");
  });
});
