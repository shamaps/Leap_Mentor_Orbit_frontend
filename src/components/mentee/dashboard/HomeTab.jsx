// src/components/mentee/dashboard/HomeTab.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import MentorProfileModal from "./findMentors/MentorProfileModal";
import LeapBuddy from "../../LeapBuddy";
import MentorCardSkeleton from "@/components/common/MentorCardSkeleton";

// ── Internal hook — fetches recommended mentors + upcoming sessions ──
const useHomeData = (profile) => {
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [escrow, setEscrow] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const skillTerm =
          profile?.skills?.[0] ||
          profile?.interestedFields?.[0] ||
          "";

        const mentorRes = await axiosInstance.get("/mentors/search", {
          params: { skill: skillTerm, limit: 4 }
        }); 
    
        setMentors(mentorRes.data.mentors || []);

        const sessionRes = await axiosInstance.get(
          "/connect-requests/my-requests",
        );
        const allRequests = sessionRes.data.requests || [];
        const upcoming = allRequests
          .filter((r) => r.status === "accepted" || r.status === "ongoing")
          .sort((a, b) => {
            if (a.status === "ongoing" && b.status !== "ongoing") return -1;
            if (a.status !== "ongoing" && b.status === "ongoing") return 1;
            return 0;
          });
        setSessions(upcoming);

        const walletRes = await axiosInstance.get("/escrow/wallet");
        setBalance(walletRes.data.balance ?? 0);
        setEscrow(walletRes.data.escrow ?? 0);
      } catch (err) {
        console.error("HomeTab data fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (profile !== null) fetchAll();
  }, [profile]);

  return { mentors, sessions, loading, balance, escrow };
};

// ── Helpers ───────────────────────────────────────────────────
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-600",
  "bg-blue-100 text-blue-900",
  "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
];
const getAvatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const formatSlotDate = (slot) => {
  if (!slot?.date) return "";
  return new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
};

const formatSlotTime = (slot) => {
  if (!slot?.startTime || !slot?.endTime) return "";
  const fmt = (t) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };
  return `${fmt(slot.startTime)} – ${fmt(slot.endTime)}`;
};

const ACCENT_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500"];
const getAccent = (idx) => ACCENT_COLORS[idx % ACCENT_COLORS.length];

const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;
  const fields = [
    profile.profilePicture,
    profile.bio,
    profile.currentRole,
    profile.company,
    profile.industry,
    profile.yearsOfExperience,
    profile.communicationPreferences?.length > 0,
    profile.languages?.length > 0,
    profile.linkedInUrl,
    profile.portfolioUrl,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

// ── Mentor Card ───────────────────────────────────────────────
const MentorCard = ({ mentor, onViewProfile }) => {
  const name = mentor.user?.name || "Mentor";
  const initials = getInitials(name);
  const avatarBg = getAvatarColor(name);
  const skills = mentor.skills?.slice(0, 2) || [];

  return (
    <div
      onClick={() => onViewProfile(mentor)}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {mentor.profilePicture ? (
            <img
              src={mentor.profilePicture}
              alt={name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg}`}>
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
            <p className="text-xs text-slate-800 truncate">{mentor.currentRole}</p>
            {mentor.company && (
              <p className="text-xs text-slate-800 truncate">@ {mentor.company}</p>
            )}
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span key={skill}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide bg-amber-50 text-slate-800 border border-blue-100">
              {skill.toUpperCase()}
            </span>
          ))}
          {mentor.avgRating > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              ⭐ {mentor.avgRating.toFixed(1)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ── Session Card ──────────────────────────────────────────────
const SessionCard = ({ request, index, navigate }) => {
  const slot = request.confirmedSlot || request.selectedSlots?.[0];
  const dateObj = slot?.date ? new Date(slot.date + "T00:00:00") : null;
  const dateNum = dateObj ? dateObj.getDate().toString() : "—";
  const dateMonth = dateObj
    ? dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    : "—";
  const mentorName = request.mentor?.name || "Mentor";
  const timeStr = formatSlotTime(slot);
  const isOngoing = request.status === "ongoing";

  const handleJoin = () => {
    if (isOngoing) navigate(`/shared-dashboard/${request._id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-3 py-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-9 h-11 rounded-xl flex flex-col items-center justify-center text-white ${getAccent(index)} shrink-0`}>
        <span className="text-[8px] font-bold tracking-widest">{dateMonth}</span>
        <span className="text-base font-bold leading-none">{dateNum}</span>
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-slate-800 truncate">{mentorName}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0
            ${isOngoing
              ? "bg-blue-50 text-blue-900 border border-blue-100"
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
            {isOngoing ? "Ongoing" : "Accepted"}
          </span>
        </div>
        <p className="text-[10px] text-blue-900 truncate mt-0.5">
          {timeStr ? timeStr : "Time TBD"}
          {slot?.date ? ` · ${formatSlotDate(slot)}` : ""}
        </p>
      </div>

      <div className="shrink-0">
        {isOngoing && (
          <button
            onClick={handleJoin}
            className="w-35 text-xs bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold transition-colors whitespace-nowrap"
          >
            Open Dashboard →
          </button>
        )}
      </div>
    </div>
  );
};

// ── Session Skeleton ──────────────────────────────────────────
const SessionSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 px-3 py-2.5 flex items-center gap-3 shadow-sm animate-pulse">
    <div className="w-9 h-11 rounded-xl bg-slate-200 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-slate-200 rounded w-3/5" />
      <div className="h-2.5 bg-slate-100 rounded w-2/5" />
    </div>
  </div>
);

// ── Leap Points Panel ─────────────────────────────────────────
const LeapPointsPanel = ({ balance, loading }) => {
  const [requestStatus, setRequestStatus] = useState(null); // null | "pending" | "sent" | "sending" | "error"
  const [checking, setChecking] = useState(true);
  const isBalanceEmpty = !loading && balance < 500;

  // Check if there's already a pending request
  useEffect(() => {
    const checkExistingRequest = async () => {
      try {
        const res = await axiosInstance.get("/leap-requests/my-request");
        if (res.data?.status === "pending") {
          setRequestStatus("pending");
        }
      } catch (err) {
        // 404 means no existing request — safe to ignore
        // Any other error is also non-blocking, just log it
        if (err.response?.status !== 404) {
          console.warn("Leap request check failed:", err.response?.data || err.message);
        }
      } finally {
        setChecking(false);
      }
    };
    checkExistingRequest();
  }, []);

  const handleUpgradeRequest = async () => {
    try {
      setRequestStatus("sending");
      await axiosInstance.post(
        "/leap-requests",
        { reason: "balance_refill" }
      );
      setRequestStatus("sent");
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (
        msg.toLowerCase().includes("pending") ||
        err.response?.status === 409
      ) {
        setRequestStatus("pending");
      } else {
        console.error("Leap request error:", err.response?.data || err.message);
        setRequestStatus("error");
        setTimeout(() => setRequestStatus(null), 3000);
      }
    }
  };

  const isAlreadyRequested = requestStatus === "pending" || requestStatus === "sent";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F59E0B" />
          <circle cx="12" cy="12" r="7.5" fill="#FBBF24" />
          <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400E" fontFamily="serif">LP</text>
        </svg>
        <p className="text-base font-bold text-slate-800">Leap Points</p>
      </div>

      <p className="text-xs text-blue-900 font-medium -mb-1">Current Balance</p>

      {loading ? (
        <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-slate-800 leading-none">
            {balance.toLocaleString()}
          </span>
          <span className="text-base font-bold text-amber-500">LP</span>
        </div>
      )}

      <div className="border-t border-slate-100 mt-1" />

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
        <p className="text-[10px] text-amber-800 leading-relaxed">
          Leap Points are the platform currency used to book and pay for mentoring sessions.
          Each point is equivalent to <span className="font-bold">$1.00</span>.
          Points never expire and are non-refundable once used for booking.
        </p>
      </div>

      {/* ── Upgrade / Refill Button ── */}
      {!loading && !checking && (
        <div className="mt-1">
          {isBalanceEmpty ? (
            <>
              {isAlreadyRequested ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    Request sent — pending admin review
                  </p>
                </div>
              ) : requestStatus === "error" ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-[11px] font-semibold text-red-600">Something went wrong. Try again.</p>
                </div>
              ) : (
                <button
                  onClick={handleUpgradeRequest}
                  disabled={requestStatus === "sending"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold
                    bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white
                    transition-all duration-150 shadow-sm hover:shadow-md
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {requestStatus === "sending" ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="40 20" />
                      </svg>
                      Sending request…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 11 12 6 7 11" />
                        <line x1="12" y1="6" x2="12" y2="18" />
                      </svg>
                      Request Leap Points Refill
                    </>
                  )}
                </button>
              )}
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Admin will review your activity and add 500 LP if approved.
              </p>
            </>
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold
                bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Refill available when balance runs out
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main HomeTab ──────────────────────────────────────────────
const HomeTab = ({ user, profile }) => {
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "there";
  const isFirstLogin = user?.isFirstLogin ?? false;
  const completionPct = calculateProfileCompletion(profile);
  const [selectedMentor, setSelectedMentor] = useState(null);

  const { mentors, sessions, loading, balance } = useHomeData(profile);

  return (
    <>
      <div className="flex flex-col gap-6 -mt-2">

        {/* ── Welcome + Profile Completion Pill ── */}
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isFirstLogin ? `Welcome, ${firstName}! 👋` : `Welcome , ${firstName}! 👋`}
            </h1>
            <p className="text-sm text-blue-900 mt-1">
              {sessions.length > 0
                ? `You have ${sessions.length} active session${sessions.length > 1 ? "s" : ""}.`
                : "No active sessions yet. Find a mentor to get started!"}
            </p>
          </div>

          {completionPct < 100 && (
            <div
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.dispatchEvent(new CustomEvent("setDashboardTab", { detail: "profile" }))}
            >
              <div className="relative w-9 h-9">
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e3a5f" strokeWidth="3"
                    strokeDasharray={`${completionPct} ${100 - completionPct}`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-blue-900">
                  {completionPct}%
                </span>
              </div>
              <span className="text-xs font-bold text-blue-900">Profile</span>
            </div>
          )}
        </div>

        {/* ── Recommended Mentors ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-700">Recommended Mentors</h2>
              {profile?.skills?.[0] && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Based on your skill:{" "}
                  <span className="font-semibold text-blue-900">{profile.skills[0]}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("setDashboardTab", { detail: "findMentors" }))}
              className="text-xs text-blue-900 font-medium hover:underline"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <MentorCardSkeleton variant="compact" />
                <MentorCardSkeleton variant="compact" />
                <MentorCardSkeleton variant="compact" />
                <MentorCardSkeleton variant="compact" />
              </>
            ) : mentors.length > 0 ? (
              mentors.map((mentor) => (
                <MentorCard
                  key={mentor._id || mentor.user?._id}
                  mentor={mentor}
                  onViewProfile={setSelectedMentor}
                />
              ))
            ) : (
              <div className="col-span-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-sm text-slate-700">No mentor recommendations yet.</p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("setDashboardTab", { detail: "findMentors" }))}
                  className="text-xs text-blue-900 font-semibold mt-2 hover:underline"
                >
                  Browse all mentors →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Active Sessions + Leap Points (side by side) ── */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">

          <section className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Active Sessions</h2>
            <div className="flex flex-col gap-2.5">
              {loading ? (
                <>
                  <SessionSkeleton />
                  <SessionSkeleton />
                </>
              ) : sessions.length > 0 ? (
                sessions.map((request, idx) => (
                  <SessionCard
                    key={request._id}
                    request={request}
                    index={idx}
                    navigate={navigate}
                  />
                ))
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-sm text-slate-700">No active sessions yet.</p>
                  <p className="text-xs text-slate-700 mt-1">
                    Once a mentor accepts, your sessions appear here.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="w-64 shrink-0">
            <h2 className="text-base font-semibold text-slate-700 mb-3">Wallet</h2>
            <LeapPointsPanel balance={balance} loading={loading} />
          </div>

        </div>

      </div>

      {selectedMentor && (
        <MentorProfileModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
      <LeapBuddy role="mentee" user={user} profile={profile} />
    </>
  );
};

export default HomeTab;