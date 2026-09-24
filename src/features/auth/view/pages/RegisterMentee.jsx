// src/pages/RegisterMentee.jsx
import AuthLeftPanel from "@/features/auth/view/components/AuthLeftPanel";
import RegisterForm from "@/features/auth/view/components/RegisterForm";

const MENTEE_STATS = [
  { num: "50K+", label: "Mentees" },
  { num: "200+", label: "Skills" },
  { num: "4.9★", label: "Rating" },
];

const RegisterMentee = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AuthLeftPanel
        imageSrc="/images/mentee-bg.jpg"
        imageAlt="Mentees learning"
        badge="🚀 Start your growth journey today"
        heading={
          <>
            Find the mentor who
            <br />
            unlocks your potential.
          </>
        }
        subtext={
          <>
            Connect with world-class mentors and accelerate
            <br />
            your career like never before.
          </>
        }
        stats={MENTEE_STATS}
      />
      <div className="flex flex-1 items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-105">
          <RegisterForm role="mentee" />
        </div>
      </div>
    </div>
  );
};

export default RegisterMentee;
