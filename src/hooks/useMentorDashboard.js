// src/hooks/useMentorDashboard.js
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";

const useMentorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const isEditPage = location.pathname.includes("/edit-profile");

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prevent double-fetch in React StrictMode (mount → unmount → remount)
  const hasFetched = useRef(false);

  const refetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/mentor-profile/me");
      setProfile(res.data);
    } catch (err) {
      console.error("Profile refetch failed:", err.message);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login/mentor");
      return;
    }

    // StrictMode guard — skip the second mount
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        // 1) Fetch user
        const userRes = await axiosInstance.get("/users/me");
        const userData = userRes.data;

        // 2) Role guard
        if (!userData.roles?.includes("mentor")) {
          navigate("/dashboard/mentee");
          return;
        }

        setUser(userData);

        // 3) Fetch mentor profile
        let profileData = null;
        try {
          const profileRes = await axiosInstance.get("/mentor-profile/me");
          profileData = profileRes.data;
        } catch (profileErr) {
          if (profileErr?.response?.status === 404) {
            if (!isEditPage) navigate("/onboarding/mentor");
            return;
          }
          if (profileErr?.response?.status === 401) {
            dispatch(logout());
            navigate("/login/mentor");
            return;
          }
          throw profileErr;
        }

        setProfile(profileData);

        // 4) Onboarding incomplete
        if (!profileData?.isProfileComplete && !isEditPage) {
          navigate("/onboarding/mentor");
          return;
        }

        // 5) All good
        setLoading(false);

      } catch (err) {
        if (err?.response?.status === 401) {
          dispatch(logout());
          navigate("/login/mentor");
          return;
        }
        setError("Something went wrong. Please try again.");
        setLoading(false);  // ← always unblock on error
      } finally {
        // ← CRITICAL: guarantee loading is cleared even if navigate() was
        // called in an early-return branch (e.g. 404 profile, role mismatch).
        // Without this, any early return leaves loading=true → blank screen.
        setLoading(false);
      }
    };

    fetchData();
  }, []); // ← empty dep array: run once on mount only; token is checked at top

  return { user, profile, loading, error, refetchProfile };
};

export default useMentorDashboard;