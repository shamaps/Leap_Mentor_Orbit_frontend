// src/hooks/useMenteeSettings.js
import { useState, useEffect } from "react";
import * as menteeProfileApi from "../api/menteeProfile.api";
import * as authApi from "../api/auth.api";
import * as escrowApi from "../api/escrow.api";
const useMenteeSettings = (initialProfile) => {
  const [fetching, setFetching] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  const [balance, setBalance] = useState(0);
  const [escrow, setEscrow] = useState(0);

  // ── Preferences state ─────────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingPreferences, setMarketingPreferences] = useState(false);

  // ── Change password state ─────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangedAt, setPasswordChangedAt] = useState(null);

  // ── Pre-fill from profile ─────────────────────────────────
  useEffect(() => {
    if (initialProfile) {
      setEmailNotifications(initialProfile.emailNotifications ?? true);
      setMarketingPreferences(initialProfile.marketingPreferences ?? false);
      setFetching(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setFetching(true);
        const p = await menteeProfileApi.getMenteeProfile();
        setEmailNotifications(p.emailNotifications ?? true);
        setMarketingPreferences(p.marketingPreferences ?? false);
      } catch (err) {
        // eslint-disable-line no-unused-vars
        setMsg({ type: "error", text: "Failed to load settings." });
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [initialProfile]);

  // ── Fetch passwordChangedAt from user ─────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await authApi.getCurrentUser();
        setPasswordChangedAt(data.passwordChangedAt || null);
      } catch (err) {
        // eslint-disable-line no-unused-vars
        // silent fail — not critical
      }
    };
    fetchUser();
  }, []);

  // Add this after the passwordChangedAt useEffect:
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await escrowApi.getWallet();
        setBalance(data.balance);
        setEscrow(data.escrow);
      } catch (err) {
        // eslint-disable-line no-unused-vars
        // silent fail
      }
    };
    fetchWallet();
  }, []);

  // ── Save preferences ──────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      await menteeProfileApi.updateMenteeProfile({
        emailNotifications,
        marketingPreferences,
      });
      setMsg({ type: "success", text: "Preferences saved successfully!" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      // eslint-disable-line no-unused-vars
      setMsg({ type: "error", text: "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────
  const handleChangePassword = async () => {
    setPwMsg({ type: "", text: "" });

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPwMsg({ type: "error", text: "All fields are required." });
    }
    if (newPassword.length < 6) {
      return setPwMsg({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
    }
    if (newPassword !== confirmPassword) {
      return setPwMsg({ type: "error", text: "New passwords do not match." });
    }

    try {
      setChangingPw(true);
      await authApi.changePassword(currentPassword, newPassword);

      setPwMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChangedAt(new Date().toISOString());
      setTimeout(() => setPwMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setChangingPw(false);
    }
  };

  // ── Format "last changed X ago" ───────────────────────────
  const formatPasswordAge = (dateStr) => {
    if (!dateStr) return "Never changed";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Changed today";
    if (days < 30) return `Last changed ${days} day${days > 1 ? "s" : ""} ago`;
    const months = Math.floor(days / 30);
    return `Last changed ${months} month${months > 1 ? "s" : ""} ago`;
  };

  return {
    fetching,
    saving,
    changingPw,
    msg,
    pwMsg,
    balance,
    escrow,
    emailNotifications,
    setEmailNotifications,
    marketingPreferences,
    setMarketingPreferences,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordChangedAt,
    formatPasswordAge,
    handleSave,
    handleChangePassword,
  };
};

export default useMenteeSettings;
