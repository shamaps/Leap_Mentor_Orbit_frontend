// src/components/auth/AuthLeftPanel.tsx
import type { ReactNode } from "react";

interface StatPill {
  num: string | number;
  label: string;
}

/**
 * Reusable left panel for auth pages (Register/Login).
 */
interface AuthLeftPanelProps {
  imageSrc: string;
  imageAlt?: string;
  badge?: string;
  heading?: ReactNode;
  subtext?: ReactNode;
  stats?: StatPill[];
}

const AuthLeftPanel = ({
  imageSrc,
  imageAlt,
  badge,
  heading,
  subtext,
  stats = [],
}: AuthLeftPanelProps) => {
  return (
    <div className="relative hidden lg:flex lg:w-[48%] flex-col justify-end overflow-hidden bg-slate-900">
      {/* Background image */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 w-full h-full object-cover object-top"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-slate-900/10" />

      {/* Text content */}
      <div className="relative z-10 p-12 text-white">
        {/* Badge */}
        {badge && (
          <div className="inline-block mb-5 px-4 py-1.5 rounded-full text-xs font-medium text-white/90 bg-white/10 border border-white/20 backdrop-blur-sm">
            {badge}
          </div>
        )}

        {/* Heading */}
        <h2 className="text-4xl font-bold leading-tight tracking-tight mb-4">
          {heading}
        </h2>

        {/* Subtext */}
        <p className="text-base text-white/70 leading-relaxed mb-8">
          {subtext}
        </p>

        {/* Stat pills */}
        {stats.length > 0 && (
          <div className="flex gap-3">
            {stats.map(({ num, label }) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm"
              >
                <span className="text-xl font-bold">{num}</span>
                <span className="text-[11px] uppercase tracking-wide text-white/60">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLeftPanel;