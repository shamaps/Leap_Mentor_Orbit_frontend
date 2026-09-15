interface FullScreenLoaderProps {
  message?: string;
}

const FullScreenLoader = ({ message = "Redirecting..." }: FullScreenLoaderProps) => (
  <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
    <svg
      className="animate-spin"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="16" stroke="#e2e8f0" strokeWidth="4" />
      <path
        d="M20 4a16 16 0 0 1 16 16"
        stroke="#1e3a8a"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
    <p className="text-sm font-semibold text-slate-600">{message}</p>
  </div>
);

export default FullScreenLoader;