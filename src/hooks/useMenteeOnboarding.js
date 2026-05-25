// src/hooks/useMenteeOnboarding.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { submitMenteeOnboarding, clearOnboardingMessages } from "../store/slices/menteeOnboardingSlice";

const useMenteeOnboarding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, successMsg } = useSelector((state) => state.menteeOnboarding);
  const token = useSelector((state) => state.auth.token); // ✅ FIXED: was localStorage.getItem("token")

  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem("menteeOnboardingForm");
      return saved ? JSON.parse(saved) : {
        profilePicture: "",
        bio: "",
        currentRole: "",
        company: "",
        industry: "",
        yearsOfExperience: "",
        interestedFields: [],
        skills: [],
        communicationPreferences: [],
        languages: [],
        linkedInUrl: "",
        portfolioUrl: "",
      };
    } catch {
      return {
        profilePicture: "",
        bio: "",
        currentRole: "",
        company: "",
        industry: "",
        yearsOfExperience: "",
        interestedFields: [],
        skills: [],
        communicationPreferences: [],
        languages: [],
        linkedInUrl: "",
        portfolioUrl: "",
      };
    }
  });

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (error) {
      setMsg({ type: "error", text: error });
    }

    if (successMsg) {
      sessionStorage.removeItem("menteeOnboardingForm");
      dispatch(clearOnboardingMessages());
      setRedirecting(true);
      setTimeout(() => navigate("/dashboard/mentee"), 1500);
    }
  }, [error, successMsg]);

  useEffect(() => {
    return () => { dispatch(clearOnboardingMessages()); };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("menteeOnboardingForm", JSON.stringify(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    dispatch(clearOnboardingMessages());

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

    if (!token) { navigate("/login"); return; } // ✅ still guards, now reads from Redux

    dispatch(submitMenteeOnboarding({ ...form }));
  };

  return { form, loading, msg, redirecting, handleChange, handleSubmit };
};

export default useMenteeOnboarding;