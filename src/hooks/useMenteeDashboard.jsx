// src/hooks/useMenteeDashboard.js
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useSelector } from "react-redux";

const useMenteeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditPage = location.pathname.includes("/edit-profile");

  // ✅ Moved here — top level of the hook, not inside useEffect
  const token = useSelector((state) => state.auth.token);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // ✅ Just use token directly — no hook call here
    if (!token) { navigate("/login"); return; }

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
            setLoading(false);
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
        setLoading(false);
      }
    };

    fetchData();
  }, [token]); // ✅ token added to deps array too

  return { user, profile, loading, error };
};

export default useMenteeDashboard;