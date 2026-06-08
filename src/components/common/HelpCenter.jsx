import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useLocation } from "react-router-dom";

// ─── MENTOR FAQS ─────────────────────────────────────────────────────────────

const mentorFaqs = [
  {
    category: "Sessions",
    items: [
      { q: "How do I accept a session request?", a: "Go to Requests in your sidebar. You'll see pending requests with mentee details and preferred time slots. Click 'Accept' to confirm — the mentee will be notified and prompted to complete payment." },
      { q: "What happens after a session is accepted?", a: "The session moves to 'Active Sessions' with an 'Awaiting Payment' status. Once the mentee pays, the status updates to 'Ongoing' and you'll see an 'Open Dashboard' button to start the session." },
      { q: "Can I reschedule or cancel a session?", a: "Yes. Open the session card and choose 'Reschedule' or 'Cancel'. Cancellations made less than 2 hours before the session may affect your rating. We recommend messaging the mentee first." },
      { q: "How long can a session last?", a: "Sessions are booked in 30mins , 60mins and 1-hour slots. If you and the mentee agree to extend, you can add time in 30-minute increments directly from the session dashboard." },
    ],
  },
  {
    category: "Payments & Earnings",
    items: [
      { q: "When do I receive my earnings?", a: "Earnings are released immediately after a session completes and the mentee has paid. Track all pending and received payments in the Track Earnings section." },
      { q: "What payout methods are supported?", a: "There's only token method possible now so tokens will be paid as payments " },
      { q: "Why is a session still showing 'Awaiting Payment'?", a: "The mentee hasn't completed payment yet. We send automated reminders. If it's been over 24 hours, nudge them via the message button on the session card." },
    ],
  },
  {
    category: "Profile & Availability",
    items: [
      { q: "How do I set my availability?", a: "Navigate to Availability in the sidebar. Set recurring weekly slots or block specific dates. Changes take effect immediately for new bookings." },
      { q: "How do I update my mentor profile?", a: "Go to Profile from the sidebar. Update your bio, skills, hourly rate, and photo. A complete profile gets 3x more session requests." },
    ],
  },
  {
    category: "Technical Issues",
    items: [
      { q: "The session dashboard isn't loading. What do I do?", a: "Try refreshing or clearing your browser cache. Use Chrome, Firefox, or Edge. If it persists, contact support with your session ID." },
      { q: "I'm not receiving notifications.", a: "Check Settings → Notifications and ensure your browser allows notifications from leapmentor.com. Email notifications are always enabled as a fallback." },
    ],
  },
];

// ─── MENTEE FAQS ──────────────────────────────────────────────────────────────

const menteeFaqs = [
  {
    category: "Booking",
    items: [
      { q: "How do I book a session with a mentor?", a: "Browse mentors from the Explore page, open a mentor's profile, and select an available time slot. You'll be prompted to confirm and complete payment to finalize the booking." },
      { q: "Can I book multiple sessions at once?", a: "Yes! You can book multiple sessions with the same or different mentors. All upcoming sessions are visible in your dashboard under Active Sessions." },
      { q: "What if my preferred time slot isn't available?", a: "You can only book a slot at mentor availability , or you can browse their next available openings." },
    ],
  },
  {
    category: "Payments & Refunds",
    items: [
      { q: "What payment methods are accepted?", a: "We currently accept only token payments." },
      { q: "Can I get a refund if I cancel?", a: "Cancellations made 24+ hours before the session are fully refunded. Cancellations within 24 hours receive a 50% refund. No-shows are non-refundable." },
      { q: "Where can I see my payment history?", a: "Go to Settings → Billing to view all past transactions, download receipts, and check upcoming charges." },
    ],
  },
  {
    category: "Sessions",
    items: [
      { q: "How do I join a session?", a: "When your session is active, an 'Open Dashboard' button will appear on the session card. Click it to enter the video call and shared workspace with your mentor." },
      { q: "What happens if a mentor cancels?", a: "You'll receive a full refund immediately and a notification. You can rebook with the same mentor or choose a different one." },
      { q: "Can I extend a session that's already running?", a: "Yes, if both you and the mentor agree. The mentor can add extra time from the session dashboard, and you'll be charged for the additional slot." },
    ],
  },
  {
    category: "Technical Issues",
    items: [
      { q: "The session isn't loading. What should I do?", a: "Refresh the page and check your internet connection. Make sure your browser has permission to access your camera and microphone. Try Chrome or Firefox for the best experience." },
      { q: "I paid but my session still shows 'Awaiting Confirmation'.", a: "This usually resolves within a few minutes as the mentor confirms. If it's been over 1 hour, contact support with your booking ID and payment confirmation." },
    ],
  },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const INDIGO = "#4f46e5";
const INDIGO_DARK = "#4338ca";
const INDIGO_LIGHT = "#eef2ff";
const INDIGO_BORDER = "#c7d2fe";

// ─── FAQ ITEM ─────────────────────────────────────────────────────────────────

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1.5px solid ${isOpen ? INDIGO_BORDER : "#e2e8f0"}`,
      overflow: "hidden", transition: "border-color 0.2s",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "16px 18px", background: "none",
          border: "none", cursor: "pointer", textAlign: "left", gap: 12,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 14, color: "#0f172a", lineHeight: 1.4 }}>{item.q}</span>
        <span style={{
          fontSize: 16, color: INDIGO, flexShrink: 0, display: "inline-block",
          transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}>▾</span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 18px 16px", color: "#475569", fontSize: 14, lineHeight: 1.7, borderTop: "1px solid #f1f5f9" }}>
          <div style={{ paddingTop: 12 }}>{item.a}</div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function HelpCenter() {
  const location = useLocation();
  const isMentor = location.pathname.includes("/mentor");

  const role = isMentor ? "mentor" : "mentee";
  const faqs = isMentor ? mentorFaqs : menteeFaqs;

  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [form, setForm] = useState({ email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const categories = ["All", ...faqs.map((f) => f.category)];

  const filteredFaqs = faqs
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        (activeCategory === "All" || group.category === activeCategory) &&
        (search === "" ||
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((g) => g.items.length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      await axiosInstance.post("/support/messages", { ...form, role });
      setSubmitted(true);
      setForm({ email: "", subject: "", message: "" });
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Geist', sans-serif",
      background: "#f8f9fb", minHeight: "100vh",
      padding: "32px 24px", maxWidth: 900, margin: "0 auto",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0 }}>Help Center</h1>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
            background: isMentor ? "#fef3c7" : INDIGO_LIGHT,
            color: isMentor ? "#b45309" : INDIGO,
            textTransform: "capitalize",
          }}>
            {role}
          </span>
        </div>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          {isMentor
            ? "Resources and support for managing your sessions, earnings, and profile."
            : "Find answers about booking sessions, payments, and getting the most from your mentor."}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 32 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#94a3b8", pointerEvents: "none" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setActiveCategory("All"); }}
          placeholder={`Search ${role} FAQs...`}
          style={{
            width: "100%", padding: "13px 16px 13px 44px", fontSize: 15,
            border: "1.5px solid #e2e8f0", borderRadius: 12, background: "#fff",
            outline: "none", boxSizing: "border-box", color: "#0f172a",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
          onFocus={(e) => (e.target.style.borderColor = INDIGO)}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
      </div>

      {/* FAQ */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Frequently Asked Questions</h2>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
              cursor: "pointer", border: "1.5px solid",
              borderColor: activeCategory === cat ? INDIGO : "#e2e8f0",
              background: activeCategory === cat ? INDIGO : "#fff",
              color: activeCategory === cat ? "#fff" : "#64748b",
              transition: "all 0.15s",
            }}>
              {cat}
            </button>
          ))}
        </div>

        {filteredFaqs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 32 }}>🔍</div>
            <p style={{ marginTop: 10 }}>No results for "{search}". Try different keywords.</p>
          </div>
        ) : (
          filteredFaqs.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 24 }}>
              {activeCategory === "All" && (
                <div style={{
                  fontSize: 12, fontWeight: 600, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
                }}>
                  {group.category}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.items.map((item, ii) => {
                  const key = `${gi}-${ii}`;
                  return (
                    <FaqItem
                      key={key}
                      item={item}
                      isOpen={openFaq === key}
                      onToggle={() => setOpenFaq(openFaq === key ? null : key)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "28px" }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>Still need help?</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          Send us a message and we'll get back to you within 24 hours.
        </p>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36 }}>✅</div>
            <p style={{ fontWeight: 600, color: "#0f172a", marginTop: 10 }}>Message sent!</p>
            <p style={{ color: "#64748b", fontSize: 14 }}>We'll reply to your email within 24 hours.</p>
            <button
              onClick={() => setSubmitted(false)}
              style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, background: INDIGO, color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              required type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Your email address"
              style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", color: "#0f172a", fontFamily: "inherit" }}
              onFocus={(e) => (e.target.style.borderColor = INDIGO)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <input
              required value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject"
              style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", color: "#0f172a", fontFamily: "inherit" }}
              onFocus={(e) => (e.target.style.borderColor = INDIGO)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <textarea
              required value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your issue..."
              rows={4}
              style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", resize: "vertical", color: "#0f172a", fontFamily: "inherit" }}
              onFocus={(e) => (e.target.style.borderColor = INDIGO)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            {submitError && (
              <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 24px", background: submitting ? "#a5b4fc" : INDIGO,
                color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
                fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                alignSelf: "flex-start", transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = INDIGO_DARK; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = INDIGO; }}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}