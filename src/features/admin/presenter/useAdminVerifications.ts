// src/features/admin/presenter/useAdminVerifications.js
import { useState, useEffect, useCallback } from "react";
import { getMentorVerifications, verifyMentor } from "../model/admin.api";
import { getApiFailureMessage } from "@/shared/utils/getErrorMessage";

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
  const [mentors, setMentors] = useState<AdminMentorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | verified
  const [selected, setSelected] = useState<AdminMentorVerification | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  // ── Fetch ──────────────────────────────────────────────
  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMentorVerifications();
      const data = res.data;
      setMentors(data.mentors || data);
    } catch (e) {
      setError(getApiFailureMessage(e, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const showToast = ({ message, type }: { message: string; type: string }) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Verify ─────────────────────────────────────────────
  const handleVerify = async (mentorProfileId: string) => {
    setVerifying(true);
    try {
      await verifyMentor(mentorProfileId);

      // Update local state
      setMentors((prev) =>
        prev.map((m) =>
          m._id === mentorProfileId
            ? { ...m, verificationStatus: "verified" }
            : m,
        ),
      );
      if (selected?._id === mentorProfileId) {
        setSelected((prev) => prev ? { ...prev, verificationStatus: "verified" } : prev);
      }
      showToast({ message: "✓ Mentor verified successfully!", type: "success" });
    } catch (e) {
      showToast({ message: getApiFailureMessage(e, "Something went wrong."), type: "error" });
    } finally {
      setVerifying(false);
    }
  };

  // ── Filtered list ──────────────────────────────────────
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
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    selected,
    setSelected,
    verifying,
    toast,
    fetchMentors,
    handleVerify,
    filtered,
    counts,
  };
};