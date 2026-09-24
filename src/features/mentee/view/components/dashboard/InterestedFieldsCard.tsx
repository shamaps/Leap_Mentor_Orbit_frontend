// components/mentee/dashboard/InterestedFieldsCard.jsx
const TagChip = ({ label }: { label: string; color?: string }) => {
  return (
    <span
      className={`inline-flex items-center text-sm font-m text-slate-600 px-3 py-1.5 rounded-full border `}
    >
      {label}
    </span>
  );
};

interface InterestedFieldsCardProps {
  profile?: Record<string, unknown> | null;
}

const InterestedFieldsCard = ({ profile }: InterestedFieldsCardProps) => {
  const fields = (profile?.interestedFields as string[] | undefined) || [];
  const skills = (profile?.skills as string[] | undefined) || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Interested Fields */}
      <div className="mb-5">
        <h3 className="text-m font-bold text-slate-800 mb-3">
          Interested Fields
        </h3>
        {fields.length === 0 ? (
          <p className="text-sm text-slate-800">No fields added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fields.map((f: string) => (
              <TagChip key={f} label={f} />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 mb-4" />

      {/* Top Skills */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Top Skills</h3>
        {skills.length === 0 ? (
          <p className="text-sm text-slate-800">No skills added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s: string) => (
              <TagChip key={s} label={s} color="slate" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestedFieldsCard;