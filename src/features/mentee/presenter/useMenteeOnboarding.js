// src/hooks/useMenteeOnboarding.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  submitMenteeOnboarding,
  clearOnboardingMessages,
} from "@/app/store/slices/menteeOnboardingSlice";
import { menteeOnboardingSchema, getFirstErrorMessage } from "@/features/mentee/schemas/onboardingSchemas";
import {
  selectAuthToken,
  selectMenteeOnboardingLoading,
  selectMenteeOnboardingError,
  selectMenteeOnboardingSuccessMsg,
} from "@/app/store/selectors";
import { sessionStore } from "@/shared/utils/storage";
const useMenteeOnboarding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loading = useSelector(selectMenteeOnboardingLoading);
  const error = useSelector(selectMenteeOnboardingError);
  const successMsg = useSelector(selectMenteeOnboardingSuccessMsg);
  const token = useSelector(selectAuthToken);

  const EMPTY_MENTEE_FORM = {
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

  const [form, setForm] = useState(() => {
    const saved = sessionStore.getJSON("menteeOnboardingForm");
    return saved || EMPTY_MENTEE_FORM;
  });


  const [msg, setMsg] = useState({ type: "", text: "" });
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (error) {
      setMsg({ type: "error", text: error });
    }

    if (successMsg) {
      sessionStore.remove("menteeOnboardingForm");
      dispatch(clearOnboardingMessages());
      setRedirecting(true);
      setTimeout(() => navigate("/dashboard/mentee"), 1500);
    }
  }, [error, successMsg]);

  useEffect(() => {
    return () => {
      dispatch(clearOnboardingMessages());
    };
  }, []);

  useEffect(() => {
    sessionStore.setJSON("menteeOnboardingForm", form);
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

    if (!token) {
      navigate("/login");
      return;
    }

    //  Zod schema replaces the old hand-written validateMenteeFields
    const validationError = getFirstErrorMessage(menteeOnboardingSchema, form);
    if (validationError)
      return setMsg({ type: "error", text: validationError });

    dispatch(submitMenteeOnboarding({ ...form }));
  };

  return { form, loading, msg, redirecting, handleChange, handleSubmit };
};

export default useMenteeOnboarding;