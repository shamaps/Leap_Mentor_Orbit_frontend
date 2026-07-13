import { describe, it, expect } from "vitest";
import getErrorMessage from "../../utils/getErrorMessage";

describe("getErrorMessage", () => {
    it("returns the backend message for 422 responses", () => {
        const err = { response: { status: 422, data: { message: "Email is invalid." } } };
        expect(getErrorMessage(err)).toBe("Email is invalid.");
    });

    it("returns a default message for 422 when no backend message is present", () => {
        const err = { response: { status: 422, data: {} } };
        expect(getErrorMessage(err)).toBe("Please check the highlighted fields and try again.");
    });

    it("joins field-level validation errors for 400 with an errors array", () => {
        const err = {
            response: {
                status: 400,
                data: { errors: [{ field: "email", message: "Email is required." }, { field: "password", message: "Password is too short." }] },
            },
        };
        expect(getErrorMessage(err)).toBe("Email is required. Password is too short.");
    });

    it("falls through to data.message for 400 when errors array is empty", () => {
        const err = { response: { status: 400, data: { errors: [], message: "Bad request." } } };
        expect(getErrorMessage(err)).toBe("Bad request.");
    });

    it("returns a rate-limit message for 429", () => {
        const err = { response: { status: 429, data: {} } };
        expect(getErrorMessage(err)).toBe("You're doing that a bit too fast. Please wait a moment and try again.");
    });

    it("returns a generic server message for 500", () => {
        const err = { response: { status: 500, data: {} } };
        expect(getErrorMessage(err)).toBe("Something went wrong on our end. We've been notified — please try again shortly.");
    });

    it("returns a generic server message for 502/503", () => {
        expect(getErrorMessage({ response: { status: 502, data: {} } })).toBe(
            "Something went wrong on our end. We've been notified — please try again shortly.",
        );
        expect(getErrorMessage({ response: { status: 503, data: {} } })).toBe(
            "Something went wrong on our end. We've been notified — please try again shortly.",
        );
    });

    it("returns data.message for other statuses when present", () => {
        const err = { response: { status: 404, data: { message: "Not found." } } };
        expect(getErrorMessage(err)).toBe("Not found.");
    });

    it("falls back to err.message when there's no response data message", () => {
        const err = { message: "Network Error" };
        expect(getErrorMessage(err)).toBe("Network Error");
    });

    it("falls back to the provided fallback string when nothing else is available", () => {
        expect(getErrorMessage({}, "Custom fallback.")).toBe("Custom fallback.");
    });

    it("uses the default fallback when none is provided and nothing else is available", () => {
        expect(getErrorMessage({})).toBe("Something went wrong.");
    });
});