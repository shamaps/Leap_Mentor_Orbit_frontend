import { describe, it, expect } from "vitest";
import {
    pickDisplaySlot,
    mapReferredMentor,
    mapConnectRequest,
    mapConnectRequestList,
} from "../../mappers/connectRequestMapper";
import { mapMentorFullProfile } from "../../mappers/mentorMapper";

describe("pickDisplaySlot", () => {
    it("returns the first selectedSlot when status is pending", () => {
        const request = { status: "pending", selectedSlots: ["slot1", "slot2"] };
        expect(pickDisplaySlot(request)).toBe("slot1");
    });

    it("returns null when pending and selectedSlots is empty", () => {
        expect(pickDisplaySlot({ status: "pending", selectedSlots: [] })).toBeNull();
    });

    it("returns null when pending and selectedSlots is entirely absent", () => {
        expect(pickDisplaySlot({ status: "pending" })).toBeNull();
    });

    it("returns confirmedSlot for a non-pending status when present", () => {
        const request = { status: "confirmed", confirmedSlot: "final-slot", selectedSlots: ["s1"] };
        expect(pickDisplaySlot(request)).toBe("final-slot");
    });

    it("falls back to first selectedSlot for non-pending status when confirmedSlot is absent", () => {
        const request = { status: "ongoing", selectedSlots: ["s1", "s2"] };
        expect(pickDisplaySlot(request)).toBe("s1");
    });

    it("returns null for non-pending status when neither confirmedSlot nor selectedSlots exist", () => {
        expect(pickDisplaySlot({ status: "completed" })).toBeNull();
    });
});

describe("mapReferredMentor", () => {
    it("returns null when person is falsy", () => {
        expect(mapReferredMentor(null, {})).toBeNull();
        expect(mapReferredMentor(undefined, {})).toBeNull();
    });

    it("builds a full mentor profile from person + profile fields", () => {
        const person = { _id: "mt1", name: "Alice", email: "alice@example.com" };
        const profile = { bio: "Great mentor", currentRole: "Engineer" };
        const result = mapReferredMentor(person, profile);
        expect(result).toEqual(
            mapMentorFullProfile({ ...profile, _id: "mt1", name: "Alice", email: "alice@example.com" }),
        );
    });

    it("handles an absent profile object gracefully (spreading undefined is a no-op)", () => {
        const person = { _id: "mt2", name: "Bob", email: "bob@example.com" };
        const result = mapReferredMentor(person, undefined);
        expect(result).toEqual(
            mapMentorFullProfile({ _id: "mt2", name: "Bob", email: "bob@example.com" }),
        );
    });
});

describe("mapConnectRequest", () => {
    it("returns null when given a falsy value", () => {
        expect(mapConnectRequest(null)).toBeNull();
        expect(mapConnectRequest(undefined)).toBeNull();
    });

    it("maps a full connect request with referral fields on both sides", () => {
        const raw = {
            _id: "cr1",
            status: "pending",
            selectedSlots: ["slot1"],
            confirmedSlot: null,
            referredTo: { _id: "mtTo", name: "Mentor To", email: "to@example.com" },
            referredToProfile: { bio: "To bio" },
            referredBy: { _id: "mtBy", name: "Mentor By", email: "by@example.com" },
            referredByProfile: { bio: "By bio" },
        };
        const result = mapConnectRequest(raw);
        expect(result.selectedSlots).toEqual(["slot1"]);
        expect(result.confirmedSlot).toBeNull();
        expect(result.displaySlot).toBe("slot1");
        expect(result.referredMentor).toEqual(
            mapMentorFullProfile({ bio: "To bio", _id: "mtTo", name: "Mentor To", email: "to@example.com" }),
        );
        expect(result.referredByMentor).toEqual(
            mapMentorFullProfile({ bio: "By bio", _id: "mtBy", name: "Mentor By", email: "by@example.com" }),
        );
    });

    it("defaults selectedSlots to [] and confirmedSlot to null when absent", () => {
        const result = mapConnectRequest({ _id: "cr2", status: "pending" });
        expect(result.selectedSlots).toEqual([]);
        expect(result.confirmedSlot).toBeNull();
    });

    it("sets referredMentor/referredByMentor to null when referredTo/referredBy are absent", () => {
        const result = mapConnectRequest({ _id: "cr3", status: "pending" });
        expect(result.referredMentor).toBeNull();
        expect(result.referredByMentor).toBeNull();
    });

    it("preserves all other raw fields via the spread (lossless mapping)", () => {
        const raw = { _id: "cr4", status: "pending", someOtherField: "keep-me" };
        expect(mapConnectRequest(raw).someOtherField).toBe("keep-me");
    });
});

describe("mapConnectRequestList", () => {
    it("maps a list of raw connect requests", () => {
        const rawList = [
            { _id: "cr1", status: "pending" },
            { _id: "cr2", status: "confirmed", confirmedSlot: "slot-x" },
        ];
        const result = mapConnectRequestList(rawList);
        expect(result).toHaveLength(2);
        expect(result[0]._id).toBe("cr1");
        expect(result[1].displaySlot).toBe("slot-x");
    });

    it("defaults to an empty array when called with no argument", () => {
        expect(mapConnectRequestList()).toEqual([]);
    });

    it("returns an empty array when given an empty array", () => {
        expect(mapConnectRequestList([])).toEqual([]);
    });
});