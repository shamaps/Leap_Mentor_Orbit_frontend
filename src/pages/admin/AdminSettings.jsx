// src/pages/admin/AdminSettings.jsx
import { useState, useEffect } from "react";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import { useToast } from "../../context/ToastContext";
const FONT = "'DM Sans', sans-serif";
const MONO = "'DM Mono', monospace";

const SectionCard = ({
  title,
  subtitle,
  icon,
  children,
  accent = "#2563eb",
}) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}
  >
    <div
      className="px-6 py-5 border-b flex items-center gap-3"
      style={{ borderColor: "#e8eaf0", background: "#fafbfc" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}14` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p
          className="text-sm font-700 text-slate-800"
          style={{ fontWeight: 700, fontFamily: FONT }}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const SubmitBtn = ({ loading, label, onClick, accent = "#2563eb" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-600 text-white transition-all disabled:opacity-50 whitespace-nowrap"
    style={{
      background: accent,
      fontWeight: 600,
      fontFamily: FONT,
      boxShadow: `0 4px 14px ${accent}30`,
    }}
  >
    {loading && (
      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
    )}
    {loading ? "Saving..." : label}
  </button>
);

const OverviewCard = ({ label, value, icon, accent, sub }) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden"
    style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}
  >
    <div
      className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
      style={{
        background: `radial-gradient(circle at top right, ${accent}15, transparent 70%)`,
      }}
    />
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: `${accent}14` }}
    >
      <span style={{ color: accent }}>{icon}</span>
    </div>
    <div>
      <p
        className="text-2xl font-700 text-slate-900"
        style={{ fontWeight: 700, fontFamily: FONT }}
      >
        {value?.toLocaleString() ?? "—"}
      </p>
      <p className="text-xs text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminSettings = () => {
  const [overview, setOverview] = useState({
    totalUsers: 0,
    activeSessions: 0,
  });
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [tempPw, setTempPw] = useState("");
  const [commission, setCommission] = useState("");
  const [savingCommission, setSavingCommission] = useState(false);
  const { showToast } = useToast();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, cmRes] = await Promise.all([
          adminAxiosInstance.get("/admin/settings/overview"),
          adminAxiosInstance.get("/admin/settings/commission"),
        ]);
        setOverview({
          totalUsers: ovRes.data.totalUsers,
          activeSessions: ovRes.data.activeSessions,
        });
        setCommission(String(cmRes.data.commissionRate));
      } catch {
        showToast({ message: "Failed to load settings.", type: "error" });
      }
    };
    fetchData();
  }, []);

  const handleAddAdmin = async () => {
    if (!adminName.trim() || !adminEmail.trim()) {
      return showToast({ message: "Name and email are required.", type: "error" });
    }
    try {
      setAddingAdmin(true);
      setTempPw("");
      const res = await adminAxiosInstance.post("/admin/settings/admins", {
        name: adminName.trim(),
        email: adminEmail.trim(),
      });
      setTempPw(res.data.tempPassword);
      showToast({ message: `Admin account created for ${adminEmail}` });
      setAdminName("");
      setAdminEmail("");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to create admin.",
        "error",
      );
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleSaveCommission = async () => {
    const rate = parseFloat(commission);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return showToast({ message: "Commission must be between 0 and 100.", type: "error" });
    }
    try {
      setSavingCommission(true);
      await adminAxiosInstance.patch("/admin/settings/commission", {
        commissionRate: rate,
      });
      showToast({ message: `Commission rate set to ${rate}%` });
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to update commission.",
        "error",
      );
    } finally {
      setSavingCommission(false);
    }
  };

  return (
  <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-700 text-slate-900"
            style={{ fontWeight: 700, fontFamily: FONT }}
          >
            Admin Settings
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage platform configurations and preferences.
          </p>
        </div>

        {/* ── Commission Rate ── */}
        <SectionCard
          title="Platform Commission Rate"
          subtitle="Set the % deducted from each mentor payout"
          accent="#d97706"
          icon={
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                fontFamily: MONO,
                color: "currentColor",
                letterSpacing: "-0.02em",
              }}
            >
              LP
            </span>
          }
        >
          {/* Fixed layout — input + button side by side, button aligned to input height */}
          <div className="flex gap-3" style={{ alignItems: "flex-start" }}>
            <div style={{ width: 240 }}>
              <label
                className="text-xs font-600 text-slate-900 block mb-1.5"
                style={{ fontWeight: 600, fontFamily: FONT }}
              >
                Commission Rate (%)
              </label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                  fontFamily: FONT,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#fed7aa")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <p className="text-[10px] text-slate-600 mt-1">
                Applied to every mentor payout. Must be between 0–100.
              </p>
            </div>

            {/*  mt-6 pushes button down to align with input (label height = ~1.5rem) */}
            <div style={{ marginTop: "1.6rem" }}>
              <SubmitBtn
                loading={savingCommission}
                label="Save Rate"
                onClick={handleSaveCommission}
                accent="#d97706"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Add Other Admin ── */}
        <SectionCard
          title="Add Other Admin"
          subtitle="Invite a new admin to manage the platform"
          accent="#059669"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          }
        >
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div>
              <label
                className="text-xs font-600 text-slate-900 block mb-1.5"
                style={{ fontWeight: 600, fontFamily: FONT }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Sarah Admin"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                  fontFamily: FONT,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#93c5fd")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label
                className="text-xs font-600 text-slate-900 block mb-1.5"
                style={{ fontWeight: 600, fontFamily: FONT }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@leapmentor.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                  fontFamily: FONT,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#93c5fd")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <p className="text-[10px] text-slate-600 mt-1">
                {" "}
                Password will be generated.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <SubmitBtn
              loading={addingAdmin}
              label="Create Admin Account"
              onClick={handleAddAdmin}
              accent="#059669"
            />
          </div>

          {tempPw && (
            <div
              className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>
                <p
                  className="text-xs font-600 text-emerald-700"
                  style={{ fontWeight: 600 }}
                >
                  Password — share securely with the new admin:
                </p>
                <p
                  className="text-sm font-700 text-emerald-800 mt-0.5"
                  style={{ fontFamily: MONO, fontWeight: 700 }}
                >
                  {tempPw}
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
  </>
  );
};

export default AdminSettings;
