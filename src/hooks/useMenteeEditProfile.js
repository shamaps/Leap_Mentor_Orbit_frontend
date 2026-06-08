// src/hooks/useMenteeEditProfile.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";

const useMenteeEditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    currentRole: "", industry: "", company: "",
    yearsOfExperience: "", bio: "", profilePicture: "",
    linkedInUrl: "", portfolioUrl: "",
    skills: [], interestedFields: [],
    communicationPreferences: [], languages: [],
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

    // ✅ Required field validations
    if (!form.currentRole.trim())
      return setMsg({ type: "error", text: "Current Role is required." });
    if (!form.yearsOfExperience)
      return setMsg({ type: "error", text: "Years of Experience is required." });
    if (!form.industry)
      return setMsg({ type: "error", text: "Industry is required." });
    if (!form.interestedFields.length)
      return setMsg({ type: "error", text: "Please add at least one Field of Interest." });
    if (!form.skills.length)
      return setMsg({ type: "error", text: "Please add at least one Skill of Interest." });

    const isOnlyNumbers = (val) => val && /^\d+$/.test(val.trim());
    if (isOnlyNumbers(form.currentRole))
      return setMsg({ type: "error", text: "Current Role cannot be a number." });
    if (isOnlyNumbers(form.company))
      return setMsg({ type: "error", text: "Company name cannot be a number." });

    const isValidUrl = (val) => {
      if (!val) return true;
      try { new URL(val); return true; }
      catch { return false; }
    };
    if (!isValidUrl(form.linkedInUrl))
      return setMsg({ type: "error", text: "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username)." });
    if (!isValidUrl(form.portfolioUrl))
      return setMsg({ type: "error", text: "Please enter a valid Portfolio URL (e.g. https://yoursite.com)." });

    try {
      const payload = {
        ...form,
        yearsOfExperience: form.yearsOfExperience, // ✅ keep as string
      };
      await axiosInstance.put("/mentee-profile/me", payload);
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