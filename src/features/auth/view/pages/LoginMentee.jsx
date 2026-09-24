// src/pages/LoginMentee.jsx
import LoginLeftPanel from "@/features/auth/view/components/LoginLeftPanel";
import LoginForm from "@/features/auth/view/components/LoginForm";

const LoginMentee = () => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-[45%] shrink-0">
        <LoginLeftPanel role="mentee" />
      </div>
      <main className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <LoginForm
          placeholder="you@example.com"
          registerPath="/register/mentee"
        />
      </main>
    </div>
  );
};

export default LoginMentee;
