// src/test/hooks/useMentorEditProfile.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import logger from "../../utils/logger";
import * as mentorProfileApi from "../../api/mentorProfile.api";
import { getFirstErrorMessage } from "../../schemas/onboardingSchemas";
import { refetchMentorProfile } from "../../store/slices/mentorProfileSlice";
import useMentorEditProfile from "../../hooks/useMentorEditProfile";

vi.mock("react-router-dom");
vi.mock("react-redux");
vi.mock("../../utils/logger");
vi.mock("../../api/mentorProfile.api");
vi.mock("../../schemas/onboardingSchemas", () => ({
    commonOnboardingSchema: {},
    getFirstErrorMessage: vi.fn(),
}));
vi.mock("../../store/slices/mentorProfileSlice", () => ({
    refetchMentorProfile: vi.fn(() => ({ type: "refetchMentorProfile" })),
}));

describe("useMentorEditProfile", () => {
    let navigate;
    let dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        navigate = vi.fn();
        dispatch = vi.fn().mockResolvedValue({});
        useNavigate.mockReturnValue(navigate);
        useDispatch.mockReturnValue(dispatch);
        useSelector.mockReturnValue("valid-token");
        getFirstErrorMessage.mockReturnValue(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("initial fetch", () => {
        it("populates form fields, joining array languages into a comma string", async () => {
            mentorProfileApi.getMentorProfile.mockResolvedValue({
                bio: "Hi",
                currentRole: "Engineer",
                industry: "Tech",
                company: "Acme",
                yearsOfExperience: 5,
                hourlyRate: 50,
                skills: ["React"],
                communicationPreferences: ["email"],
                languages: ["English", "Hindi"],
                linkedInUrl: "https://linkedin.com/x",
                portfolioUrl: "https://p.com",
                profilePicture: "pic.jpg",
            });

            const { result } = renderHook(() => useMentorEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(result.current.form.languages).toBe("English, Hindi");
            expect(result.current.form.currentRole).toBe("Engineer");
        });

        it("keeps languages as-is when already a string", async () => {
            mentorProfileApi.getMentorProfile.mockResolvedValue({ languages: "Tamil, English" });

            const { result } = renderHook(() => useMentorEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(result.current.form.languages).toBe("Tamil, English");
        });

        it("defaults missing fields appropriately", async () => {
            mentorProfileApi.getMentorProfile.mockResolvedValue({});

            const { result } = renderHook(() => useMentorEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(result.current.form).toEqual({
                profilePicture: "",
                bio: "",
                currentRole: "",
                industry: "",
                company: "",
                yearsOfExperience: "",
                hourlyRate: "",
                skills: [],
                communicationPreferences: [],
                languages: "",
                linkedInUrl: "",
                portfolioUrl: "",
            });
        });

        it("logs a warning and sets an error message when the fetch fails", async () => {
            mentorProfileApi.getMentorProfile.mockRejectedValue(new Error("network fail"));

            const { result } = renderHook(() => useMentorEditProfile());

            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            expect(logger.warn).toHaveBeenCalledWith("Failed to load mentor profile data", {
                message: "network fail",
            });
            expect(result.current.msg).toEqual({
                type: "error",
                text: "Failed to load profile data.",
            });
        });
    });

    describe("handleChange", () => {
        it("updates the named field", async () => {
            mentorProfileApi.getMentorProfile.mockResolvedValue({});
            const { result } = renderHook(() => useMentorEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            act(() => {
                result.current.handleChange({ target: { name: "bio", value: "New bio" } });
            });

            expect(result.current.form.bio).toBe("New bio");
        });
    });

    describe("handleSubmit", () => {
        const makeEvent = () => ({ preventDefault: vi.fn() });

        it("shows a validation error and does not call the API", async () => {
            mentorProfileApi.getMentorProfile.mockResolvedValue({});
            getFirstErrorMessage.mockReturnValue("Bio is required.");
            const { result } = renderHook(() => useMentorEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            const event = makeEvent();
            await act(async () => {
                await result.current.handleSubmit(event);
            });

            expect(event.preventDefault).toHaveBeenCalled();
            expect(result.current.msg).toEqual({ type: "error", text: "Bio is required." });
            expect(mentorProfileApi.updateMentorProfile).not.toHaveBeenCalled();
        });

        it("redirects to /login when there is no auth token", async () => {
            useSelector.mockReturnValue(null);
            mentorProfileApi.getMentorProfile.mockResolvedValue({});
            const { result } = renderHook(() => useMentorEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(navigate).toHaveBeenCalledWith("/login");
            expect(mentorProfileApi.updateMentorProfile).not.toHaveBeenCalled();
        });

        it("submits with numeric coercion and split languages, then redirects", async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            mentorProfileApi.getMentorProfile.mockResolvedValue({});
            mentorProfileApi.updateMentorProfile.mockResolvedValue({});

            const { result } = renderHook(() => useMentorEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            act(() => {
                result.current.handleChange({ target: { name: "yearsOfExperience", value: "7" } });
                result.current.handleChange({ target: { name: "hourlyRate", value: "40" } });
                result.current.handleChange({
                    target: { name: "languages", value: "English, Hindi, " },
                });
            });

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(mentorProfileApi.updateMentorProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    yearsOfExperience: 7,
                    hourlyRate: 40,
                    languages: ["English", "Hindi"],
                }),
            );
            expect(dispatch).toHaveBeenCalledWith(refetchMentorProfile());
            expect(result.current.msg).toEqual({
                type: "success",
                text: "Profile updated! Redirecting to dashboard…",
            });

            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            expect(navigate).toHaveBeenCalledWith("/dashboard/mentor");
        });

        it("coerces invalid numeric strings to 0", async () => {
            mentorProfileApi.getMentorProfile.mockResolvedValue({});
            mentorProfileApi.updateMentorProfile.mockResolvedValue({});

            const { result } = renderHook(() => useMentorEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            act(() => {
                result.current.handleChange({ target: { name: "yearsOfExperience", value: "" } });
                result.current.handleChange({ target: { name: "hourlyRate", value: "abc" } });
            });

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(mentorProfileApi.updateMentorProfile).toHaveBeenCalledWith(
                expect.objectContaining({ yearsOfExperience: 0, hourlyRate: 0 }),
            );
        });

        it("sets an error message on update failure", async () => {
            mentorProfileApi.getMentorProfile.mockResolvedValue({});
            mentorProfileApi.updateMentorProfile.mockRejectedValue({
                response: { data: { message: "Update rejected" } },
            });

            const { result } = renderHook(() => useMentorEditProfile());
            await waitFor(() => expect(result.current.fetchLoading).toBe(false));

            await act(async () => {
                await result.current.handleSubmit(makeEvent());
            });

            expect(result.current.msg.type).toBe("error");
            expect(result.current.loading).toBe(false);
        });
    });
});