// src/hooks/useMenteeEditProfile.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as menteeProfileApi from "../api/menteeProfile.api";
import { validateMenteeFields } from "../utils/onboardingValidation";

const useMenteeEditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
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

  useEffect(() => {
    const fetchProfile = async () => {
      setFetchLoading(true);
      try {
        const data = await menteeProfileApi.getMenteeProfile();
        setForm({
          currentRole: data.currentRole || "",
          industry: data.industry || "",
          company: data.company || "",
          yearsOfExperience: data.yearsOfExperience || "",
          bio: data.bio || "",
          profilePicture: data.profilePicture || "",
          linkedInUrl: data.linkedInUrl || "",
          portfolioUrl: data.portfolioUrl || "",
          skills: data.skills || [],
          interestedFields: data.interestedFields || [],
          communicationPreferences: data.communicationPreferences || [],
          languages: data.languages || [],
        });
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setMsg({ type: "error", text: "Failed to load profile data." });
        }
      } finally {
        if (!controller.signal.aborted) setFetchLoading(false);
      }
    };
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    const validationError = validateMenteeFields(form);
    if (validationError) {
      setLoading(false);
      return setMsg({ type: "error", text: validationError });
    }

    try {
      const payload = {
        ...form,
        yearsOfExperience: form.yearsOfExperience,
      };
      await menteeProfileApi.updateMenteeProfile(payload);
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => navigate("/dashboard/mentee"), 1500);
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Update failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, fetchLoading, msg, handleChange, handleSubmit };
};

export default useMenteeEditProfile;
