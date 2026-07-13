// src/hooks/useMentorEditProfile.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import logger from "../utils/logger";
import * as mentorProfileApi from "../api/mentorProfile.api";
import getErrorMessage from "../utils/getErrorMessage";
import { commonOnboardingSchema, getFirstErrorMessage } from "../schemas/onboardingSchemas";
import { selectAuthToken } from "../store/selectors";
import { refetchMentorProfile } from "../store/slices/mentorProfileSlice";
const useMentorEditProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector(selectAuthToken);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
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