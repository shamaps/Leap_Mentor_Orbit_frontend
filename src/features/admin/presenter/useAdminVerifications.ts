// src/features/admin/presenter/useAdminVerifications.ts
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router-dom";

export interface AdminMentorVerification {
  _id: string;
  verificationStatus: string;
  profilePicture?: string;
  bio?: string;
  company?: string;
  currentRole?: string;
  industry?: string;
  languages?: string[];
  phoneNumber?: string;
  skills: string[];
  yearsOfExperience?: number;
  resumeDocument?: { url?: string; uploadedAt?: string };
  workExperienceDocuments?: { url: string }[];
  user?: { _id?: string; name?: string; email?: string };
}

export const useAdminVerifications = () => {
  const { mentors, error } = useLoaderData() as {
    mentors: AdminMentorVerification[];
    error: string | null;
  };
  const fetcher = useFetcher<{ success: boolean; mentorProfileId?: string; error?: string }>();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const verifying = fetcher.state !== "idle";

  const selected = mentors.find((m) => m._id === selectedId) ?? null;
  const setSelected = (mentor: AdminMentorVerification | null) => setSelectedId(mentor?._id ?? null);

  const showToast = ({ message, type }: { message: string; type: string }) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleVerify = (mentorProfileId: string) => {
    fetcher.submit({ mentorProfileId }, { method: "post" });
  };

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.success) {
      // fetcher.data is an external system's result; reacting to it settling
      // by showing a toast is the "subscribe to external state change" case
      // the rule allows, not a derived-state anti-pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showToast({ message: "✓ Mentor verified successfully!", type: "success" });
    } else {
      showToast({ message: fetcher.data.error || "Something went wrong.", type: "error" });
    }
  }, [fetcher.state, fetcher.data]);

  const filtered = mentors.filter((m) => {
    const matchSearch =
      m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "pending" && m.verificationStatus !== "verified") ||
      (filter === "verified" && m.verificationStatus === "verified");
    return matchSearch && matchFilter;
  });

  const counts = {
    all: mentors.length,
    pending: mentors.filter((m) => m.verificationStatus !== "verified").length,
    verified: mentors.filter((m) => m.verificationStatus === "verified").length,
  };

  return {
    mentors,
    loading: false,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    selected,
    setSelected,
    verifying,
    toast,
    handleVerify,
    filtered,
    counts,
  };
};