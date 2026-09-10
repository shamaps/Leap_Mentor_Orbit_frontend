import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        Oops! The page you’re looking for doesn’t exist.
      </p>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 rounded-lg bg-black text-white"
        >
          Go Home
        </button>

        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-lg border"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
