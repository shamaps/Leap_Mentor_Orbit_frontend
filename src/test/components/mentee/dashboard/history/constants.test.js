// src/test/components/mentee/dashboard/history/constants.test.js
import { describe, it, expect } from "vitest";
import {
    TABS,
    STATUS_STYLES,
    STATUS_LABELS,
    formatDate,
    formatTime,
    getInitials,
} from "../../../../../features/mentee/view/components/dashboard/history/constants";

describe("history constants module", () => {
    describe("TABS", () => {
        it("should contain all seven expected tab keys in order", () => {
            expect(TABS.map((t) => t.key)).toEqual([
                "all",
                "pending",
                "accepted",
                "ongoing",
                "completed",
                "rejected",
                "referred",
            ]);
        });
    });

    describe("STATUS_STYLES / STATUS_LABELS", () => {
        it("should define a style and label for every non-'all' status", () => {
            const statusKeys = TABS.map((t) => t.key).filter((k) => k !== "all");
            for (const key of statusKeys) {
                expect(STATUS_STYLES[key]).toBeDefined();
                expect(STATUS_LABELS[key]).toBeDefined();
            }
        });
    });

    describe("formatDate", () => {
        it("should return an em dash for falsy input", () => {
            expect(formatDate(null)).toBe("—");
            expect(formatDate("")).toBe("—");
            expect(formatDate(undefined)).toBe("—");
        });

        it("should format an ISO date string into a readable US date", () => {
            expect(formatDate("2026-08-15T10:00:00.000Z")).toMatch(/Aug \d{1,2}, 2026/);
        });
    });

    describe("formatTime", () => {
        it("should return an empty string for falsy input", () => {
            expect(formatTime("")).toBe("");
            expect(formatTime(null)).toBe("");
        });

        it("should format 24hr times into 12hr AM/PM notation", () => {
            expect(formatTime("09:05")).toBe("09:05 AM");
            expect(formatTime("14:30")).toBe("02:30 PM");
            expect(formatTime("00:00")).toBe("12:00 AM");
            expect(formatTime("12:00")).toBe("12:00 PM");
        });
    });

    describe("getInitials", () => {
        it("should return '?' when name is missing", () => {
            expect(getInitials(undefined)).toBe("?");
            expect(getInitials("")).toBe("?");
        });

        it("should return the first two initials, uppercased", () => {
            expect(getInitials("jordan lee")).toBe("JL");
            expect(getInitials("Madonna")).toBe("M");
            expect(getInitials("Ana Maria Cruz Lopez")).toBe("AM");
        });
    });
});