// src/features/admin/view/pages/AdminVerifications.jsx
import { useAdminVerifications } from "../../presenter/useAdminVerifications";
import PropTypes from "prop-types";
import ErrorState from "@/shared/components/ErrorState";
// ── Icons 
const IconShield = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconCheck = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
IconCheck.propTypes = {
  size: PropTypes.number,
};
const IconX = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
IconX.propTypes = {
  size: PropTypes.number,
};
const IconDoc = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconEye = () => (
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconPhone = () => (
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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconBriefcase = () => (
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
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconUser = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconFilter = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IconClose = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconExternalLink = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const IconStar = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ── Badge ────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const isVerified = status === "verified";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={
        isVerified
          ? { background: "#dcfce7", color: "#15803d" }
          : { background: "#fef9c3", color: "#a16207" }
      }
    >
      {isVerified ? (
        <>
          <IconCheck size={10} /> Verified
        </>
      ) : (
        <span style={{ fontSize: 9 }}>●</span>
      )}
      {isVerified ? "" : " Pending"}
    </span>
  );
};
StatusBadge.propTypes = {
  status: PropTypes.string,
};
// ── Doc Preview Card ─────────────────────────────────────
const DocCard = ({ label, url, icon }) => {
  if (!url) return null;
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 hover:border-blue-300 hover:shadow-sm"
      style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#eff6ff", color: "#2563eb" }}
      >
        {isImage ? (
          <img
            src={url}
            alt={label}
            className="w-9 h-9 rounded-lg object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          icon || <IconDoc />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {isImage ? "Image" : "PDF / Document"} · Click to view
        </p>
      </div>
      <span className="text-slate-300 group-hover:text-blue-500 transition-colors">
        <IconExternalLink />
      </span>
    </a>
  );
};
DocCard.propTypes = {
  label: PropTypes.string.isRequired,
  url: PropTypes.string,
  icon: PropTypes.node,
};
// ── Skill pill ───────────────────────────────────────────
const Pill = ({ label }) => (
  <span
    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
    style={{ background: "#eff6ff", color: "#1d4ed8" }}
  >
    {label}
  </span>
);
Pill.propTypes = {
  label: PropTypes.string.isRequired,
};
// ══════════════════════════════════════════════════════════
// DETAIL DRAWER (Updated)
// ══════════════════════════════════════════════════════════
const DetailDrawer = ({ mentor, onClose, onVerify, verifying }) => {
  if (!mentor) return null;
  const { user } = mentor;
  const mentorProfile = mentor; // mentor itself is the flat MentorProfile document
  const isVerified = mentorProfile?.verificationStatus === "verified";

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 cursor-default"
        style={{
          background: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(3px)",
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(600px, 100vw)",
          background: "#ffffff",
          boxShadow: "-8px 0 40px rgba(15,23,42,0.15)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
          style={{ borderColor: "#e8eaf0", background: "#f8fafc" }}
        >
          <div className="flex items-center gap-3">
            {mentorProfile?.profilePicture ? (
              <img
                src={mentorProfile.profilePicture}
                alt={user?.name}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "M"}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={mentorProfile?.verificationStatus} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Professional Background Section */}
          <section>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
              style={{ background: "#eff6ff" }}
            >
              <span style={{ color: "#1e40af" }}>
                <IconBriefcase />
              </span>
              <p className="text-xs font-bold text-blue-900">
                Professional Background
              </p>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 px-1">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Current Role
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {mentorProfile?.currentRole || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Company
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {mentorProfile?.company || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Industry
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {mentorProfile?.industry || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  Experience
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {mentorProfile?.yearsOfExperience || 0} Years
                </p>
              </div>
            </div>
          </section>

          {/* Personal info */}
          <section>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
              style={{ background: "#eff6ff" }}
            >
              <span style={{ color: "#1e40af" }}>
                <IconUser />
              </span>
              <p className="text-xs font-bold text-blue-900">
                Contact & Language
              </p>
            </div>
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-2 py-1.5">
                <span className="text-slate-400">
                  <IconPhone />
                </span>
                <span className="text-xs text-slate-500 w-24 flex-shrink-0">
                  Phone Number
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {mentorProfile?.phoneNumber || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 py-1.5">
                <span className="text-slate-400">
                  <IconUser />
                </span>
                <span className="text-xs text-slate-500 w-24 flex-shrink-0">
                  Languages
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {mentorProfile?.languages?.join(", ") || "English"}
                </span>
              </div>
            </div>
          </section>

          {/* Bio */}
          {mentorProfile?.bio && (
            <section>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                style={{ background: "#eff6ff" }}
              >
                <p className="text-xs font-bold text-blue-900">Bio</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed px-1">
                {mentorProfile.bio}
              </p>
            </section>
          )}

          {/* Skills */}
          {mentorProfile?.skills?.length > 0 && (
            <section>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                style={{ background: "#eff6ff" }}
              >
                <span style={{ color: "#1e40af" }}>
                  <IconBriefcase />
                </span>
                <p className="text-xs font-bold text-blue-900">
                  Skills & Expertise
                </p>
              </div>
              <div className="flex flex-wrap gap-2 px-1">
                {mentorProfile.skills.map((s) => (
                  <Pill key={s} label={s} />
                ))}
              </div>
            </section>
          )}

          {/* Documents */}
          <section>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
              style={{ background: "#eff6ff" }}
            >
              <span style={{ color: "#1e40af" }}>
                <IconDoc />
              </span>
              <p className="text-xs font-bold text-blue-900">
                Submitted Documents
              </p>
            </div>
            <div className="space-y-2 px-1">
              {mentorProfile?.resumeDocument?.url && (
                <DocCard
                  label="Resume / CV"
                  url={mentorProfile.resumeDocument.url}
                  icon={<IconDoc />}
                />
              )}
              {mentorProfile?.workExperienceDocuments?.map((doc, i) => (
                <DocCard
                  key={doc.url}
                  label={`Work Experience Doc ${i + 1}`}
                  url={doc.url}
                  icon={<IconBriefcase />}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer action */}
        <div
          className="px-6 py-4 border-t flex-shrink-0 flex items-center justify-between gap-3"
          style={{ borderColor: "#e8eaf0", background: "#f8fafc" }}
        >
          <p className="text-[11px] text-slate-400">
            {mentorProfile?.resumeDocument?.uploadedAt
              ? `Submitted on ${new Date(mentorProfile.resumeDocument.uploadedAt).toLocaleDateString("en-IN")}`
              : "Registration complete"}
          </p>

          {isVerified ? (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              <IconCheck size={13} /> Already Verified
            </div>
          ) : (
            <button
              onClick={() => onVerify(mentor._id)}
              disabled={verifying}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-150 disabled:opacity-60"
              style={{
                background: verifying
                  ? "#93c5fd"
                  : "linear-gradient(135deg, #1e40af, #2563eb)",
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
              }}
            >
              {verifying ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  Verifying…
                </>
              ) : (
                <>
                  <IconCheck size={13} /> Mark as Verified
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
DetailDrawer.propTypes = {
  mentor: PropTypes.shape({
    _id: PropTypes.string,
    user: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
    verificationStatus: PropTypes.string,
    phoneNumber: PropTypes.string,
    currentRole: PropTypes.string,
    company: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    resumeUrl: PropTypes.string,
    workExperienceUrls: PropTypes.array,
  }),
  onClose: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  verifying: PropTypes.bool,
};
// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
const AdminVerifications = () => {
  const {
    mentors,
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    selected,
    setSelected,
    verifying,
    toast,
    fetchMentors,
    handleVerify,
    filtered,
    counts,
  } = useAdminVerifications();

  let mentorRowsContent;
  if (loading) {
    mentorRowsContent = (
      <div className="px-5 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading mentors…</p>
      </div>
    );
  } else if (error) {
    mentorRowsContent = <ErrorState message={error} onAction={fetchMentors} compact />;
  } else if (filtered.length === 0) {
    mentorRowsContent = (
      <div className="px-5 py-16 text-center">
        <p className="text-sm text-slate-400">No mentors found.</p>
      </div>
    );
  } else {
    mentorRowsContent = filtered.map((m, i) => {
      const isVerified = m.verificationStatus === "verified";
      const docCount =
        (m.resumeDocument?.url ? 1 : 0) +
        (m.workExperienceDocuments?.length || 0);

      return (
        <div
          key={m._id || m.user?._id || i}
          role="button"
          tabIndex={0}
          className="grid items-center px-5 py-4 transition-all duration-150 hover:bg-blue-50/40 cursor-pointer"
          style={{
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1.2fr 80px",
            borderBottom:
              i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
          }}
          onClick={() => setSelected(m)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelected(m);
            }
          }}
        >
          {/* Name + avatar */}
          <div className="flex items-center gap-3 min-w-0">
            {m.profilePicture ? (
              <img
                src={m.profilePicture}
                alt={m.user?.name}
                className="w-8 h-8 rounded-xl object-cover flex-shrink-0 border border-slate-100"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#1e40af,#3b82f6)",
                }}
              >
                {m.user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <p className="text-sm font-semibold text-slate-800 truncate">
              {m.user?.name || "—"}
            </p>
          </div>

          {/* Email */}
          <p className="text-xs text-slate-500 truncate">
            {m.user?.email || "—"}
          </p>

          {/* Doc count */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">
              <IconDoc />
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {docCount}
            </span>
            {docCount === 0 && (
              <span className="text-[10px] text-slate-400">none</span>
            )}
          </div>

          {/* Phone */}
          <p className="text-xs text-slate-600">
            {m.phoneNumber || <span className="text-slate-300">—</span>}
          </p>

          {/* Status badge */}
          <StatusBadge status={m.verificationStatus} />

          {/* View button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(m);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
              style={
                isVerified
                  ? { background: "#f1f5f9", color: "#64748b" }
                  : { background: "#eff6ff", color: "#1d4ed8" }
              }
            >
              <IconEye /> View
            </button>
          </div>
        </div>
      );
    });
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all"
          style={
            toast.type === "success"
              ? { background: "#15803d", color: "#fff" }
              : { background: "#dc2626", color: "#fff" }
          }
        >
          {toast.type === "success" ? <IconCheck /> : <IconX />}
          {toast.message}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <DetailDrawer
          mentor={selected}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
          verifying={verifying}
        />
      )}

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)" }}
          >
            <span className="text-white">
              <IconShield />
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Mentor Verifications
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review submitted documents and approve mentors
            </p>
          </div>
        </div>
        <button
          onClick={fetchMentors}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-50 transition-all"
        >
          Refresh
        </button>
      </div>

      {/* ── Stat pills ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            key: "all",
            label: "Total Mentors",
            color: "#1e40af",
            bg: "#eff6ff",
          },
          {
            key: "pending",
            label: "Pending Review",
            color: "#a16207",
            bg: "#fefce8",
          },
          {
            key: "verified",
            label: "Verified",
            color: "#15803d",
            bg: "#f0fdf4",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className="flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-150"
            style={{
              background: filter === s.key ? s.bg : "#ffffff",
              borderColor: filter === s.key ? s.color : "#e8eaf0",
              boxShadow: filter === s.key ? `0 0 0 1px ${s.color}22` : "none",
            }}
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {counts[s.key]}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── Search + filter bar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: "#e2e8f0",
              background: "#ffffff",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            <IconFilter />
          </span>
          {["all", "pending", "verified"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={
                filter === f
                  ? { background: "#1e40af", color: "#fff" }
                  : { background: "#f1f5f9", color: "#475569" }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: "#e8eaf0" }}
      >
        {/* Table head */}
        <div
          className="grid items-center px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400"
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #e8eaf0",
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1.2fr 80px",
          }}
        >
          <span>Mentor</span>
          <span>Email</span>
          <span>Docs</span>
          <span>Phone</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {/* Rows */}
        {mentorRowsContent}
      </div>

      {/* Count footer */}
      {!loading && !error && (
        <p className="text-xs text-slate-400 mt-3 text-right">
          Showing {filtered.length} of {mentors.length} mentors
        </p>
      )}
    </div>
  );
};

export default AdminVerifications;