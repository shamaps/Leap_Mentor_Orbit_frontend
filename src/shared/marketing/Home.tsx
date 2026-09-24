// src/components/Home.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "@/shared/marketing/Navbar";
import Hero from "@/shared/marketing/Hero";
import Missions from "@/shared/marketing/Missions";
import Testimonials from "@/shared/marketing/Testimonials";
import Footer from "@/shared/marketing/Footer";
import { selectAuthToken, selectAuthUser } from "@/app/store/selectors";
export default function Home() {
  const navigate = useNavigate();
  const token = useSelector(selectAuthToken);
  const user = useSelector(selectAuthUser);
  const getRole = (roles: string[] | undefined): "mentor" | "mentee" | null => {
    if (roles?.includes("mentor")) return "mentor";
    if (roles?.includes("mentee")) return "mentee";
    return null;
  };
  const role = getRole(user?.roles);

  useEffect(() => {
    //  token now comes from Redux (was always null after new auth flow)
    // This auto-redirects logged-in users who visit "/" back to their dashboard
    if (token && role) {
      navigate(role === "mentor" ? "/dashboard/mentor" : "/dashboard/mentee", {
        replace: true,
      });
    }
  }, [token]); //re-runs when token appears (e.g. after bootstrapping finishes)

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Missions />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}