// src/hooks/useMenteeDashboard.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useSelector } from "react-redux";

const useMenteeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditPage = location.pathname.includes("/edit-profile");
  const token = useSelector((state) => state.auth.token);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prevent double-fetch in React StrictMode (mount → unmount → remount)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // StrictMode guard — skip the second mount
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const userRes = await axiosInstance.get("/users/me");
        const userData = userRes.data;

        if (!userData.roles?.includes("mentee")) {
          navigate("/dashboard/mentor");
          return;
        }

        setUser(userData);

        let profileData = null;
        try {
          const profileRes = await axiosInstance.get("/mentee-profile/me");
          profileData = profileRes.data;
        } catch (profileErr) {
          if (profileErr?.response?.status === 404) {
            if (!isEditPage) navigate("/onboarding/mentee");
            return;
          }
          if (profileErr?.response?.status === 401) {
            navigate("/login");
            return;
          }
          throw profileErr;
        }

        setProfile(profileData);

        if (!profileData?.isProfileComplete && !isEditPage) {
          navigate("/onboarding/mentee");
          return;
        }

        setLoading(false);

      } catch (err) {
        if (err?.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError("Something went wrong. Please try again.");
      } finally {
        // CRITICAL: guarantee loading clears on every code path —
        // early returns (404, role mismatch, onboarding redirect) were
        // all leaving loading=true → infinite spinner
        setLoading(false);
      }
    };

    fetchData();
  }, []); // empty — runs once on mount only; token checked at top

  return { user, profile, loading, error };
};

export default useMenteeDashboard;