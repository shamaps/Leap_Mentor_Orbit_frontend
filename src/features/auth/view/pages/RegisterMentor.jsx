// src/pages/RegisterMentor.jsx
import AuthLeftPanel from "@/features/auth/view/components/AuthLeftPanel";
import RegisterForm from "@/features/auth/view/components/RegisterForm";

const MENTOR_STATS = [
  { num: "10K+", label: "Mentors" },
  { num: "50K+", label: "Sessions" },
  { num: "98%", label: "Satisfaction" },
];

const RegisterMentor = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AuthLeftPanel
        imageSrc="/images/mentor-bg.jpg"
        imageAlt="Mentors collaborating"
        badge="🌍 Trusted by 10,000+ mentors globally"
        heading={
          <>
            Empowering the next
            <br />
            generation of leaders.
          </>
        }
        subtext={
          <>
            Join over 10,000+ mentors globally and start making
            <br />
            an impact today.
          </>
        }
        stats={MENTOR_STATS}
      />
      <main className="flex flex-1 items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-105">
          <RegisterForm role="mentor" />
        </div>
      </main>
    </div>
  );
};

export default RegisterMentor;
