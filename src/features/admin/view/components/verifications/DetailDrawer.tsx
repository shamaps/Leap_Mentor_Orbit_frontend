import type { AdminMentorVerification } from "../../../presenter/useAdminVerifications";
import DocCard from "./DocCard";
import VerificationStatusBadge from "./VerificationStatusBadge";
import {
    IconBriefcase,
    IconCheck,
    IconClose,
    IconDoc,
    IconPhone,
    IconUser,
} from "./VerificationIcons";

// ── Skill pill ───────────────────────────────────────────
const Pill = ({ label }: { label: string }) => (
    <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: "#eff6ff", color: "#1d4ed8" }}
    >
        {label}
    </span>
);

// ══════════════════════════════════════════════════════════
// DETAIL DRAWER (Updated)
// ══════════════════════════════════════════════════════════
const DetailDrawer = ({ mentor, onClose, onVerify, verifying }: { mentor: AdminMentorVerification; onClose: () => void; onVerify: (id: string) => void; verifying: boolean }) => {
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
                        <VerificationStatusBadge status={mentorProfile?.verificationStatus ?? "pending"} />
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
                    {(mentorProfile?.skills?.length ?? 0) > 0 && (
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
                                {(mentorProfile.skills ?? []).map((s: string) => (
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
                            {mentorProfile?.workExperienceDocuments?.map((doc, i: number) => (
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

export default DetailDrawer;