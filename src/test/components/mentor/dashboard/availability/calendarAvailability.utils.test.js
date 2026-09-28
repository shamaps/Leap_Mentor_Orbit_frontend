import { describe, it, expect } from "vitest";
import {
  format24, formatTime, getEventsForDate, getOverlappingBusy, getSlotError, getTodayLocal,
  parse24, parseTyped, removeSlotById, timeToMins, toDateStr, updateSlotById,
} from "../../../../../features/mentor/view/components/dashboard/availability/calendarAvailability.utils";

describe("calendarAvailability.utils", () => {
  it("formats dates and parses missing, midnight, noon, and afternoon times", () => {
    expect(toDateStr(2026, 0, 3)).toBe("2026-01-03");
    expect(getTodayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parse24()).toEqual({ hour12: 9, minute: 0, period: "AM" });
    expect(parse24("00:15")).toEqual({ hour12: 12, minute: 15, period: "AM" });
    expect(parse24("12:30")).toEqual({ hour12: 12, minute: 30, period: "PM" });
    expect(parse24("15:45")).toEqual({ hour12: 3, minute: 45, period: "PM" });
    expect(format24({ hour12: 12, minute: 5, period: "AM" })).toBe("00:05");
    expect(format24({ hour12: 3, minute: 30, period: "PM" })).toBe("15:30");
    expect(formatTime()).toBe("");
    expect(formatTime("not-a-date")).toBe("");
    expect(formatTime("2026-01-01T09:15:00.000Z")).toMatch(/AM|PM/);
  });

  it("parses typed times, meridiem, quarter-hour rounding, and invalid input", () => {
    expect(parseTyped("9")).toBe("09:00");
    expect(parseTyped("9:08am")).toBe("09:15");
    expect(parseTyped("12:30 am")).toBe("00:30");
    expect(parseTyped("3:30pm")).toBe("15:30");
    expect(parseTyped("11:55pm")).toBe("23:00");
    expect(parseTyped("25:00")).toBeNull();
    expect(parseTyped("09:60")).toBeNull();
    expect(parseTyped("noon")).toBeNull();
  });

  it("finds only overlapping busy slots and handles an empty list", () => {
    const slot = { startTime: "10:00", endTime: "11:00" };
    expect(getOverlappingBusy("2026-06-01", slot, [])).toEqual([]);
    expect(getOverlappingBusy("2026-06-01", slot, [
      { start: "2026-06-01T09:30:00", end: "2026-06-01T10:15:00" },
      { start: "2026-06-01T11:00:00", end: "2026-06-01T12:00:00" },
    ])).toHaveLength(1);
  });

  it("reports slot validation errors and valid slots", () => {
    expect(timeToMins()).toBe(0);
    expect(timeToMins("02:15")).toBe(135);
    expect(getSlotError("", "10:00", 30)).toBeNull();
    expect(getSlotError("10:00", "10:00", 30)).toMatch(/same/);
    expect(getSlotError("11:00", "10:00", 30)).toMatch(/after/);
    expect(getSlotError("10:00", "10:15", 30)).toMatch(/30 min/);
    expect(getSlotError("10:00", "10:30", 30)).toBeNull();
  });

  it("filters all-day and timed events for the selected local calendar date", () => {
    expect(getEventsForDate("2026-06-01", [])).toEqual([]);
    expect(getEventsForDate("2026-06-01", [
      { id: "missing" },
      { id: "match", start: "2026-06-01", allDay: true },
      { id: "other", start: "2026-06-02", allDay: true },
      { id: "timed", start: "2026-06-01T10:00:00+05:30" },
    ]).map((event) => event.id)).toEqual(["match", "timed"]);
  });

  it("removes and updates a specific slot without changing other slots", () => {
    const day = { date: "2026-06-01", slots: [
      { id: "a", startTime: "09:00", endTime: "10:00" },
      { id: "b", startTime: "10:00", endTime: "11:00" },
    ] };
    expect(removeSlotById(day, "a").slots.map((slot) => slot.id)).toEqual(["b"]);
    expect(updateSlotById(day, "b", "endTime", "12:00").slots[1].endTime).toBe("12:00");
  });
});
