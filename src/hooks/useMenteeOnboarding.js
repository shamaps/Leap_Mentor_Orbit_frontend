// src/hooks/useMenteeOnboarding.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { submitMenteeOnboarding, clearOnboardingMessages } from "../store/slices/menteeOnboardingSlice";
import { validateMenteeFields } from "../utils/onboardingValidation";
import {
  selectAuthToken,
  selectMenteeOnboardingLoading,
  selectMenteeOnboardingError,
  selectMenteeOnboardingSuccessMsg,
} from "../store/selectors";

const useMenteeOnboarding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loading = useSelector(selectMenteeOnboardingLoading);
  const error = useSelector(selectMenteeOnboardingError);
  const successMsg = useSelector(selectMenteeOnboardingSuccessMsg);
  const token = useSelector(selectAuthToken);

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

    if (!token) { navigate("/login"); return; }

    //  shared util — replaces copy-pasted validation
    const validationError = validateMenteeFields(form);
    if (validationError) return setMsg({ type: "error", text: validationError });

    dispatch(submitMenteeOnboarding({ ...form }));
  };

  return { form, loading, msg, redirecting, handleChange, handleSubmit };
};

export default useMenteeOnboarding;