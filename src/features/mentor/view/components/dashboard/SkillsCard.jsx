// components/mentor/dashboard/SkillsCard.jsx
import PropTypes from "prop-types";
const SkillsCard = ({profile}) => {
  const skills = profile?.skills || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Skills & Expertise</h3>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-slate-400">No skills added yet.</p>
      ) : (
        <div>
          <p className="text-xs text-slate-400 font-medium mb-2">Core Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center text-xs font-semibold bg-blue-50 text-blue-900 px-3 py-1.5 rounded-full border border-blue-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
SkillsCard.propTypes = {
  profile: PropTypes.shape({
    skills: PropTypes.arrayOf(PropTypes.string),
  }),
};
export default SkillsCard;
