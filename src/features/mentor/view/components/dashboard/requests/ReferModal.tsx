// src/components/mentor/dashboard/requests/ReferModal.jsx
import { useState, useEffect } from "react";
import { getSimilarMentors, referRequest } from "@/features/connects/model/connectRequests.api";
import EmptyState from "@/shared/components/EmptyState";

interface SuggestedMentorUser {
  _id: string;
  name: string;
}

interface SuggestedMentor {
  _id: string;
  user?: SuggestedMentorUser;
  profilePicture?: string;
  skills: string[];
  avgRating?: number;
  currentRole?: string;
  company?: string;
}

const ReferModal = ({
  request,
  onClose,
  onReferred,
}: {
  request: Record<string, any>;
  onClose: () => void;
  onReferred: (id: string, status: string) => void;
}) => {
  const [mentors, setMentors] = useState<SuggestedMentor[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [referring, setReferring] = useState(false);
  const [selected, setSelected] = useState<SuggestedMentor | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  //  Fetch similar mentors on mount
  useEffect(() => {
    const fetchSimilarMentors = async () => {
      try {
        setLoading(true);
        const data = await getSimilarMentors(request._id);
        setMentors(data.mentors || []);
        setMySkills(data.mySkills || []);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to load similar mentors.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSimilarMentors();
  }, [request._id]);

  // Submit referral
  const handleRefer = async () => {
    if (!selected?.user) return;
    try {
      setReferring(true);
      setError("");
      await referRequest(request._id, selected.user._id);
      setSuccess(true);
      onReferred(request._id, "referred");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to refer request.");
    } finally {
      setReferring(false);
    }
  };

  const mentee = request.mentee;
  const initials = mentee?.name
    ? mentee.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  // ── Success screen ────────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-emerald-600 mb-2">
            Request Referred!
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-2">
            You&apos;ve referred{" "}
            <span className="font-semibold text-slate-700">
              {mentee?.name}&apos;s
            </span>{" "}
            request to{" "}
            <span className="font-semibold text-slate-700">
              {selected?.user?.name}
            </span>.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6 mt-1">
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              📨 The request now appears in {selected?.user?.name}&apos;s incoming
              requests tab.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-all duration-150"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  let mentorSuggestionsContent;
  if (loading) {
    mentorSuggestionsContent = (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">
          Finding similar mentors...
        </p>
      </div>
    );
  } else if (mentors.length === 0) {
    mentorSuggestionsContent = (
      <EmptyState
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        message="No similar mentors found"
        subMessage="No other published mentors share your skills yet."
        compact
      />
    );
  } else {
    mentorSuggestionsContent = (
      <>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
          {mentors.length} mentor{mentors.length > 1 ? "s" : ""} with
          similar skills
        </p>

        {/* ── Mentor list ── */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {mentors.map((mentor) => {
            const mInitials = mentor.user?.name
              ? mentor.user.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
              : "?";
            const isSelected = selected?._id === mentor._id;
            const matchingSkills = mentor.skills.filter((s) =>
              mySkills
                .map((ms) => ms.toLowerCase())
                .includes(s.toLowerCase()),
            );

            return (
              <button
                key={mentor._id}
                type="button"
                onClick={() => setSelected(mentor)}
                className={`w-full text-left rounded-2xl border-2 px-4 py-3.5 transition-all duration-150 ${isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {mentor.profilePicture ? (
                    <img
                      src={mentor.profilePicture}
                      alt={mentor.user?.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {mInitials}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {mentor.user?.name}
                      </p>
                      {(mentor.avgRating ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold shrink-0">
                          ⭐ {mentor.avgRating!.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {mentor.currentRole}
                      {mentor.company ? ` · ${mentor.company}` : ""}
                    </p>
                    {/* Matching skills */}
                    {matchingSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {matchingSkills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                        {matchingSkills.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-medium self-center">
                            +{matchingSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-slate-300"
                      }`}
                  >
                    {isSelected && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRefer}
            disabled={!selected || referring}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shadow-emerald-200"
          >
            {referring ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
                Referring...
              </span>
            ) : (
              "Refer Request"
            )}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Refer to Another Mentor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a mentor with similar skills to forward this request
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748B"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* ── Mentee info pill ── */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {mentee?.name}
              </p>
              <p className="text-xs text-slate-400">{mentee?.email}</p>
            </div>
            <span className="ml-auto text-xs text-slate-400 font-medium">
              Mentee
            </span>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
              <span>⚠</span> {error}
            </div>
          )}

          {/* ── Loading / Empty / Mentor list ── */}
          {mentorSuggestionsContent}
        </div>
      </div>
    </div>
  );
};

export default ReferModal;