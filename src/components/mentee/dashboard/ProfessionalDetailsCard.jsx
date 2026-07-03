// components/mentee/dashboard/ProfessionalDetailsCard.jsx
import { useSelector } from "react-redux";
import { selectMenteeProfile } from "../../../store/selectors";
const Field = ({ label, icon, value }) => (
  <div className="py-3 border-b border-slate-100 last:border-0">
    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">
      {label}
    </p>
    <div className="flex items-center gap-2 text-sm text-slate-600">
      {icon}
      <span>{value || "—"}</span>
    </div>
  </div>
);

const ProfessionalDetailsCard = () => {
  const { profile } = useSelector(selectMenteeProfile);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-m font-bold text-slate-800 mb-4">
        Professional Details
      </h3>

      <div className="divide-y divide-slate-100">
        <Field
          label="Current Role"
          value={profile?.currentRole}
          icon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          }
        />
        <Field
          label="Experience"
          value={
            profile?.yearsOfExperience
              ? `${profile.yearsOfExperience} Years`
              : "—"
          }
          icon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <Field
          label="Company"
          value={profile?.company}
          icon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="18" rx="1" />
              <line x1="8" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="16" y2="21" />
              <line x1="2" y1="9" x2="22" y2="9" />
              <line x1="2" y1="15" x2="22" y2="15" />
            </svg>
          }
        />
        <Field
          label="Industry"
          value={profile?.industry}
          icon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          }
        />
      </div>
    </div>
  );
};

export default ProfessionalDetailsCard;
