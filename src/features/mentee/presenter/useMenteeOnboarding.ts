// src/hooks/useMenteeOnboarding.js
import { useState, useEffect } from "react";
import type { SubmitEvent as ReactSubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/app/store/hooks";
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
export interface MenteeOnboardingFieldEvent {
  target: { name: string; value: unknown };
}

export interface MenteeOnboardingForm {
  profilePicture: string;
  bio: string;
  currentRole: string;
  company: string;
  industry: string;
  yearsOfExperience: string | number;
  interestedFields: string[];
  skills: string[];
  communicationPreferences: string[];
  languages: string[] | string;
  linkedInUrl: string;
  portfolioUrl: string;
  [key: string]: unknown;
}

const useMenteeOnboarding = () => {
  const navigate = useNavigate();
  // Store/slices are still plain JS (Phase 2 typing not yet done), so
  // useDispatch() isn't thunk-aware here. Cast locally rather than
  // coupling this migration to that one.
   
  const dispatch = useAppDispatch();

  const loading = useSelector(selectMenteeOnboardingLoading);
  const error = useSelector(selectMenteeOnboardingError);
  const successMsg = useSelector(selectMenteeOnboardingSuccessMsg);
  const token = useSelector(selectAuthToken);

  const EMPTY_MENTEE_FORM: MenteeOnboardingForm = {
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

  const [form, setForm] = useState<MenteeOnboardingForm>(() => {
    const saved = sessionStore.getJSON<MenteeOnboardingForm>("menteeOnboardingForm");
    return saved || EMPTY_MENTEE_FORM;
  });

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally syncing local state from an external source (prop/URL), not derivable from render inputs alone
      setMsg({ type: "error", text: error });
    }

    if (successMsg) {
      sessionStore.remove("menteeOnboardingForm");
      dispatch(clearOnboardingMessages());
      setRedirecting(true);
      setTimeout(() => navigate("/dashboard/mentee"), 1500);
    }
  }, [dispatch, error, navigate, successMsg]);

  useEffect(() => {
    return () => {
      dispatch(clearOnboardingMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    sessionStore.setJSON("menteeOnboardingForm", form);
  }, [form]);

  const handleChange = (e: MenteeOnboardingFieldEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: ReactSubmitEvent<HTMLFormElement>) => {
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