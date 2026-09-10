import { describe, it, expect, vi } from "vitest";
import { mapServerErrorsToForm } from "../../shared/utils/mapServerErrorsToForm";

describe("mapServerErrorsToForm", () => {
    it("maps each field-specific error to setError", () => {
        const setError = vi.fn();
        const err = { response: { data: { errors: { email: "Email already in use", password: "Too weak" } } } };
        mapServerErrorsToForm(err, setError);
        expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Email already in use" });
        expect(setError).toHaveBeenCalledWith("password", { type: "server", message: "Too weak" });
        expect(setError).toHaveBeenCalledTimes(2);
    });

    it("takes the first item when a field error is an array", () => {
        const setError = vi.fn();
        const err = { response: { data: { errors: { email: ["Invalid format", "Already exists"] } } } };
        mapServerErrorsToForm(err, setError);
        expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Invalid format" });
    });

    it("skips falsy field messages", () => {
        const setError = vi.fn();
        const err = { response: { data: { errors: { email: "Invalid", password: "" } } } };
        mapServerErrorsToForm(err, setError);
        expect(setError).toHaveBeenCalledTimes(1);
        expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Invalid" });
    });

    it("falls back to a generic message on the fallback field when no field errors are mapped", () => {
        const setError = vi.fn();
        const err = { response: { data: { message: "Invalid credentials." } } };
        mapServerErrorsToForm(err, setError);
        expect(setError).toHaveBeenCalledWith("root", { type: "server", message: "Invalid credentials." });
    });

    it("uses a custom fallbackField when provided", () => {
        const setError = vi.fn();
        const err = { response: { data: { message: "Invalid credentials." } } };
        mapServerErrorsToForm(err, setError, { fallbackField: "password" });
        expect(setError).toHaveBeenCalledWith("password", { type: "server", message: "Invalid credentials." });
    });

    it("falls back to err.message when no response data message exists", () => {
        const setError = vi.fn();
        const err = { message: "Network Error" };
        mapServerErrorsToForm(err, setError);
        expect(setError).toHaveBeenCalledWith("root", { type: "server", message: "Network Error" });
    });

    it("falls back to a generic default message when nothing is available", () => {
        const setError = vi.fn();
        mapServerErrorsToForm({}, setError);
        expect(setError).toHaveBeenCalledWith("root", { type: "server", message: "Something went wrong. Please try again." });
    });

    it("falls through to the generic message when errors object is empty", () => {
        const setError = vi.fn();
        const err = { response: { data: { errors: {}, message: "Nothing mapped." } } };
        mapServerErrorsToForm(err, setError);
        expect(setError).toHaveBeenCalledWith("root", { type: "server", message: "Nothing mapped." });
    });
});