// src/pages/LoginMentor.jsx
import LoginLeftPanel from "../components/LoginLeftPanel";
import LoginForm from "../components/LoginForm";

const LoginMentor = () => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-[45%] shrink-0">
        <LoginLeftPanel role="mentor" />
      </div>

      <main className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <LoginForm
          role="mentor"
          placeholder="mentor@example.com"
          registerPath="/register/mentor"
        />
      </main>
    </div>
  );
};

export default LoginMentor;
