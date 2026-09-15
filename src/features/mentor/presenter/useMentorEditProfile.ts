// src/hooks/useMentorEditProfile.js
import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import logger from "@/shared/utils/logger";
import * as mentorProfileApi from "@/features/mentor/model/mentorProfile.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { commonOnboardingSchema, getFirstErrorMessage } from "@/features/mentee/schemas/onboardingSchemas";
import { selectAuthToken } from "@/app/store/selectors";
import { refetchMentorProfile } from "@/app/store/slices/mentorProfileSlice";
import type { MentorOnboardingChangeEvent } from "@/features/mentor/context/MentorOnboardingFormContext";
const useMentorEditProfile = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    profilePicture: "",
    bio: "",
    currentRole: "",
    industry: "",
    company: "",
    education: "",
    yearsOfExperience: "" as string | number,
    hourlyRate: "" as string | number,
    skills: [] as string[],
    communicationPreferences: [] as string[],
    languages: "" as string | string[],
    linkedInUrl: "",
    portfolioUrl: "",
  });

  // Pre-fill form with existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await mentorProfileApi.getMentorProfile();
        setForm({
          profilePicture: data.profilePicture || "",
          bio: data.bio || "",
          currentRole: data.currentRole || "",
          industry: data.industry || "",
          company: data.company || "",
          education: data.education || "",
          yearsOfExperience: data.yearsOfExperience || "",
          hourlyRate: data.hourlyRate || "",
          skills: data.skills || [],
          communicationPreferences: data.communicationPreferences || [],
          languages: Array.isArray(data.languages)
            ? data.languages.join(", ")
            : data.languages || "",
          linkedInUrl: data.linkedInUrl || "",
          portfolioUrl: data.portfolioUrl || "",
        });
      } catch (err) {
        logger.warn("Failed to load mentor profile data", { message: err?.message });
        setMsg({ type: "error", text: "Failed to load profile data." });
      } finally {
        setFetchLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: MentorOnboardingChangeEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const validationError = getFirstErrorMessage(commonOnboardingSchema, form);
    if (validationError)
      return setMsg({ type: "error", text: validationError });

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        hourlyRate: Number(form.hourlyRate) || 0,
        languages:
          typeof form.languages === "string"
            ? form.languages
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
            : form.languages,
      };

      await mentorProfileApi.updateMentorProfile(payload);
      await Promise.resolve(dispatch(refetchMentorProfile()));

      setMsg({
        type: "success",
        text: "Profile updated! Redirecting to dashboard…",
      });
      setTimeout(() => navigate("/dashboard/mentor"), 1000);
    } catch (err) {
      const apiMsg = getErrorMessage(err);
      setMsg({ type: "error", text: apiMsg });
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, fetchLoading, msg, handleChange, handleSubmit };
};

export default useMentorEditProfile;