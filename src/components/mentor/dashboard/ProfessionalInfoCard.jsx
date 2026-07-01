// components/mentor/dashboard/ProfessionalInfoCard.jsx
import { useSelector } from "react-redux";
import { selectMentorProfile } from "../../../store/selectors";
const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-600 font-medium mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{value || "—"}</p>
  </div>
);

const ProfessionalInfoCard = () => {
  const { profile } = useSelector(selectMentorProfile);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Professional Info</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Current Role" value={profile?.currentRole} />
        <Field label="Industry" value={profile?.industry} />
        <Field label="Company" value={profile?.company} />
        <Field
          label="Experience"
          value={profile?.yearsOfExperience ? `${profile.yearsOfExperience}+ Years` : "—"}
        />
        {profile?.hourlyRate > 0 && (
          <Field label="Session Rate" value={`${profile.hourlyRate} LP`} />
        )}
        {profile?.avgRating > 0 && (
          <Field label="Rating" value={`⭐ ${profile.avgRating.toFixed(1)} / 5`} />
        )}
      </div>
    </div>
  );
};

export default ProfessionalInfoCard;