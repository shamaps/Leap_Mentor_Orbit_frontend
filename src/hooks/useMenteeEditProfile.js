// src/hooks/useMenteeEditProfile.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
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
      try {
        const { data } = await axiosInstance.get("/mentee-profile/me");
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
      await axiosInstance.patch("/mentee-profile/me", payload);
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
