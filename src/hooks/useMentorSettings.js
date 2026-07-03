// src/hooks/useMentorSettings.js
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const BADGES = [
  {
    key: "newcomer",
    label: "Newcomer",
    icon: "👋",
    desc: "Joined LeapMentor",
    condition: () => true, // always unlocked
  },
  {
    key: "ten_sessions",
    label: "10 Sessions",
    icon: "🎯",
    desc: "Completed 10 sessions",
    condition: (profile) => (profile?.totalSessions || 0) >= 10,
  },
  {
    key: "top_rated",
    label: "Top Rated",
    icon: "⭐",
    desc: "Achieved 4.5+ rating",
    condition: (profile) => (profile?.avgRating || 0) >= 4.5,
  },
  {
    key: "expert_guide",
    label: "Expert Guide",
    icon: "🏆",
    desc: "50+ sessions completed",
    condition: (profile) => (profile?.totalSessions || 0) >= 50,
  },
];

const useMentorSettings = (initialProfile) => {
  const [profile, setProfile] = useState(initialProfile || null);
  const [fetching, setFetching] = useState(!initialProfile); // skip fetch if profile passed in
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // ── Local editable state ──────────────────────────────────
  const [hourlyRate, setHourlyRate] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // ── Fetch mentor profile on mount ────────────────────────
  useEffect(() => {
    if (initialProfile) {
      // Profile already passed in — just pre-fill the form, no API call needed
      setHourlyRate(initialProfile.hourlyRate ?? "");
      setEmailNotifications(initialProfile.emailNotifications ?? true);
      setPublicProfile(initialProfile.isProfilePublished ?? true);
      setFetching(false);
      return;
    }

    // No profile passed in — fetch it
    const fetchProfile = async () => {
      try {
        setFetching(true);
        const res = await axiosInstance.get("/mentor-profile/me");
        const p = res.data;
        setProfile(p);
        setHourlyRate(p.hourlyRate ?? "");
        setEmailNotifications(p.emailNotifications ?? true);
        setPublicProfile(p.isProfilePublished ?? true);
      } catch (err) {
        setMsg({ type: "error", text: "Failed to load settings." });
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [initialProfile]);
  // ── Save changes ──────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      await axiosInstance.put("/mentor-profile/me", {
        hourlyRate: Number(hourlyRate) || 0,
        emailNotifications,
        isProfilePublished: publicProfile,
      });
      setMsg({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Compute badges ────────────────────────────────────────
  const badges = BADGES.map((badge) => ({
    ...badge,
    unlocked: badge.condition(profile),
  }));

  return {
    profile,
    fetching,
    saving,
    msg,
    hourlyRate,
    setHourlyRate,
    emailNotifications,
    setEmailNotifications,
    publicProfile,
    setPublicProfile,
    badges,
    handleSave,
  };
};

export default useMentorSettings;
