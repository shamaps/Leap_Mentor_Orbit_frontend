// src/hooks/useMentorDashboard.js
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMentorDashboard,
  refetchMentorProfile,
} from "@/app/store/slices/mentorProfileSlice";
import { selectAuthToken, selectMentorProfile } from "@/app/store/selectors";

const useMentorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const token = useSelector(selectAuthToken);
  const { user, profile, loading, error } = useSelector(selectMentorProfile);
  const isEditPage = location.pathname.includes("/edit-profile");

  // Prevent double-fetch in React StrictMode (mount → unmount → remount)
  const hasFetched = useRef(false);

  const refetchProfile = () => {
    dispatch(refetchMentorProfile());
  };

  useEffect(() => {
    if (!token) {
      navigate("/login/mentor");
      return;
    }

    // StrictMode guard — skip the second mount
    if (hasFetched.current) return;
    hasFetched.current = true;

    dispatch(fetchMentorDashboard()).then((result) => {
      if (fetchMentorDashboard.rejected.match(result)) {
        const reason = result.payload?.reason;

        if (reason === "wrong-role") {
          navigate("/dashboard/mentee");
          return;
        }
        if (reason === "no-profile") {
          if (!isEditPage) navigate("/onboarding/mentor");
          return;
        }
        if (reason === "unauthorized") {
          // logoutUser() side effects already dispatched inside fetchMentorDashboard on 401.
          navigate("/login/mentor");
          return;
        }
        // reason === "error" — error message already set in slice state
        return;
      }

      // fulfilled — check onboarding completeness, same as original step 4
      const profileData = result.payload.profile;
      if (!profileData?.isProfileComplete && !isEditPage) {
        navigate("/onboarding/mentor");
      }
    });
  }, []); // ← empty dep array: run once on mount only; token is checked at top

  return { user, profile, loading, error, refetchProfile };
};

export default useMentorDashboard;
