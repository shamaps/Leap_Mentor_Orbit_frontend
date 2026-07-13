// src/test/hooks/useMenteeEditProfile.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import * as menteeProfileApi from "../../api/menteeProfile.api";
import { getFirstErrorMessage } from "../../schemas/onboardingSchemas";
import useMenteeEditProfile from "../../hooks/useMenteeEditProfile";

vi.mock("react-router-dom");
vi.mock("../../api/menteeProfile.api");
vi.mock("../../schemas/onboardingSchemas", () => ({
    menteeOnboardingSchema: {},
    getFirstErrorMessage: vi.fn(),
}));

const fullProfile = {
    currentRole: "Engineer",
    industry: "Tech",
    company: "Acme",
    yearsOfExperience: 5,
    bio: "Hello",
    profilePicture: "pic.jpg",
    linkedInUrl: "https://linkedin.com/x",
    portfolioUrl: "https://portfolio.com",
    skills: ["React"],
    interestedFields: ["AI"],
    communicationPreferences: ["email"],
    languages: ["English"],
};

describe("useMenteeEditProfile", () => {
    let navigate;

    beforeEach(() => {
        vi.clearAllMocks();
        navigate = vi.fn();
        useNavigate.mockReturnValue(navigate);
        getFirstErrorMessage.mockReturnValue(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("initial fetch", () => {
        it("populates form fields from the fetched profile", async () => {
            menteeProfileApi.getMenteeProfile.mockResolvedValue(fullProfile);

            const { result } = renderHook(() => useMenteeEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(result.current.form).toEqual(fullProfile);
        });

        it("defaults missing fields to empty strings/arrays", async () => {
            menteeProfileApi.getMenteeProfile.mockResolvedValue({});

            const { result } = renderHook(() => useMenteeEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(result.current.form).toEqual({
                currentRole: "",
                industry: "",
                company: "",
                yearsOfExperience: "",
                bio: "",
                profilePicture: "",
                linkedInUrl: "",
                portfolioUrl: "",
                skills: [],
                interestedFields: [],
                communicationPreferences: [],
                languages: [],
            });
        });

        it("sets an error message when the fetch fails with a real error", async () => {
            menteeProfileApi.getMenteeProfile.mockRejectedValue(new Error("boom"));

            const { result } = renderHook(() => useMenteeEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(result.current.msg).toEqual({
                type: "error",
                text: "Failed to load profile data.",
            });
        });

        it("does not set an error message when the fetch is aborted (CanceledError)", async () => {
            const abortErr = new Error("canceled");
            abortErr.name = "CanceledError";
            menteeProfileApi.getMenteeProfile.mockRejectedValue(abortErr);

            const { result } = renderHook(() => useMenteeEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(result.current.msg).toEqual({ type: "", text: "" });
        });

        it("aborts the in-flight request on unmount", () => {
            menteeProfileApi.getMenteeProfile.mockReturnValue(new Promise(() => { }));

            const { unmount } = renderHook(() => useMenteeEditProfile());

            expect(() => unmount()).not.toThrow();
            expect(menteeProfileApi.getMenteeProfile).toHaveBeenCalledWith(
                expect.any(AbortSignal),
            );
        });
    });

    describe("handleChange", () => {
        it("updates the named field in form state", async () => {
            menteeProfileApi.getMenteeProfile.mockResolvedValue({});
            const { result } = renderHook(() => useMenteeEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            act(() => {
                result.current.handleChange({ target: { name: "bio", value: "New bio" } });
            });

            expect(result.current.form.bio).toBe("New bio");
        });
    });

    describe("handleSubmit", () => {
        const makeEvent = () => ({ preventDefault: vi.fn() });

        it("prevents default and shows a validation error without calling the API", async () => {
            menteeProfileApi.getMenteeProfile.mockResolvedValue({});
            getFirstErrorMessage.mockReturnValue("Bio is required.");
            const { result } = renderHook(() => useMenteeEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            const event = makeEvent();
            await act(async () => {
                await result.current.handleSubmit(event);
            });

            expect(event.preventDefault).toHaveBeenCalled();
            expect(menteeProfileApi.updateMenteeProfile).not.toHaveBeenCalled();
            expect(result.current.msg).toEqual({ type: "error", text: "Bio is required." });
            expect(result.current.loading).toBe(false);
        });

        it("submits successfully, shows a success message, and navigates after a delay", async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            menteeProfileApi.getMenteeProfile.mockResolvedValue({});
            menteeProfileApi.updateMenteeProfile.mockResolvedValue({});

            const { result } = renderHook(() => useMenteeEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(menteeProfileApi.updateMenteeProfile).toHaveBeenCalled();
            expect(result.current.msg).toEqual({
                type: "success",
                text: "Profile updated successfully!",
            });
            expect(navigate).not.toHaveBeenCalled();

            await act(async () => {
                vi.advanceTimersByTime(1500);
            });

            expect(navigate).toHaveBeenCalledWith("/dashboard/mentee");
        });

        it("sets an error message from the API response on failure", async () => {
            menteeProfileApi.getMenteeProfile.mockResolvedValue({});
            menteeProfileApi.updateMenteeProfile.mockRejectedValue({
                response: { data: { message: "Company name too long" } },
            });

            const { result } = renderHook(() => useMenteeEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(result.current.msg).toEqual({
                type: "error",
                text: "Company name too long",
            });
            expect(result.current.loading).toBe(false);
        });

        it("falls back to a generic error message when the API gives none", async () => {
            menteeProfileApi.getMenteeProfile.mockResolvedValue({});
            menteeProfileApi.updateMenteeProfile.mockRejectedValue({});

            const { result } = renderHook(() => useMenteeEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(result.current.msg).toEqual({ type: "error", text: "Update failed." });
        });
    });
});