// src/hooks/useMenteeDashboard.jsx
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMenteeDashboard } from "@/app/store/slices/menteeProfileSlice";
import { selectAuthToken, selectMenteeProfile } from "@/app/store/selectors";

const useMenteeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Store/slices are still plain JS (Phase 2 typing not yet done), so
  // useDispatch() isn't thunk-aware here. Cast locally rather than
  // coupling this migration to that one.
   
  const dispatch = useDispatch() as any;
  const isEditPage = location.pathname.includes("/edit-profile");
  const token = useSelector(selectAuthToken);
  const { user, profile, loading, error } = useSelector(selectMenteeProfile);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

     
    dispatch(fetchMenteeDashboard()).then((result: any) => {
      if (fetchMenteeDashboard.rejected.match(result)) {
         
        const reason = (result.payload as any)?.reason;

        if (reason === "wrong-role") {
          navigate("/dashboard/mentor");
          return;
        }
        if (reason === "no-profile") {
          if (!isEditPage) navigate("/onboarding/mentee");
          return;
        }
        if (reason === "unauthorized") {
          navigate("/login");
          return;
        }
        return;
      }

      const profileData = result.payload.profile;
      if (!profileData?.isProfileComplete && !isEditPage) {
        navigate("/onboarding/mentee");
      }
    });
  }, []);

  return { user, profile, loading, error };
};

export default useMenteeDashboard;