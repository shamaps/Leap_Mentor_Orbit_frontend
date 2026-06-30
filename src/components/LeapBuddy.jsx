// src/components/LeapBuddy.jsx
// Usage: <LeapBuddy role="mentor" /> or <LeapBuddy role="mentee" />

import { useState, useRef, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import PropTypes from "prop-types";
const INDIGO = "#4f46e5";
const INDIGO_LIGHT = "#eef2ff";
const INDIGO_BORDER = "#c7d2fe";

// ─── FAQ Knowledge Base ───────────────────────────────────────────────────────

const mentorFaqs = [
  { q: "How do I accept a session request?", a: "Go to Requests in your sidebar. You'll see pending requests with mentee details and preferred time slots. Click Accept to confirm — the mentee will be notified and prompted to complete payment." },
  { q: "What happens after a session is accepted?", a: "The session moves to Active Sessions with an Awaiting Payment status. Once the mentee pays, the status updates to Ongoing and you'll see an Open Dashboard button to start the session." },
  { q: "Can I reschedule or cancel a session?", a: "Yes. Open the session card and choose Reschedule or Cancel. Cancellations made less than 2 hours before the session may affect your rating." },
  { q: "When do I receive my earnings?", a: "Earnings are released immediately after a session completes and the mentee has paid. Track all pending and received payments in the Track Earnings section." },
  { q: "What payout methods are supported?", a: "Only token payments are supported right now." },
  { q: "How do I set my availability?", a: "Navigate to Availability in the sidebar. Set recurring weekly slots or block specific dates. Changes take effect immediately for new bookings." },
  { q: "How do I update my mentor profile?", a: "Go to Profile from the sidebar. Update your bio, skills, hourly rate, and photo. A complete profile gets 3x more session requests." },
  { q: "The session dashboard is not loading.", a: "Try refreshing or clearing your browser cache. Use Chrome, Firefox, or Edge. If it persists, contact support with your session ID." },
  { q: "I am not receiving notifications.", a: "Check Settings then Notifications and ensure your browser allows notifications from leapmentor.com." },
];

const menteeFaqs = [
  { q: "How do I book a session with a mentor?", a: "Browse mentors from the Explore page, open a mentor's profile, and select an available time slot. You'll be prompted to confirm and complete payment to finalize the booking." },
  { q: "Can I get a refund if I cancel?", a: "Cancellations made 24+ hours before the session are fully refunded. Cancellations within 24 hours receive a 50% refund. No-shows are non-refundable." },
  { q: "How do I join a session?", a: "When your session is active, an Open Dashboard button will appear on the session card. Click it to enter the video call and shared workspace with your mentor." },
  { q: "What happens if a mentor cancels?", a: "You'll receive a full refund immediately and a notification. You can rebook with the same mentor or choose a different one." },
  { q: "What payment methods are accepted?", a: "We currently accept only token payments." },
  { q: "I paid but my session still shows Awaiting Confirmation.", a: "This usually resolves within a few minutes as the mentor confirms. If it has been over 1 hour, contact support with your booking ID and payment confirmation." },
  { q: "Can I book multiple sessions at once?", a: "Yes! You can book multiple sessions with the same or different mentors. All upcoming sessions are visible in your dashboard under Active Sessions." },
  { q: "The session is not loading.", a: "Refresh the page and check your internet connection. Make sure your browser has permission to access your camera and microphone. Try Chrome or Firefox." },
];

// ─── Build System Prompt WITH user context ────────────────────────────────────
// This is what your manager means by "system context messages"
// We pass user info so the AI gives personalized answers

function buildSystemPrompt(role, userContext) {
  const faqs = role === "mentor" ? mentorFaqs : menteeFaqs;
  const faqText = faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");

  // Build a context block from whatever user info is available
  const contextLines = [];
  if (userContext?.name) contextLines.push(`- User's name: ${userContext.name}`);
  if (userContext?.email) contextLines.push(`- User's email: ${userContext.email}`);
  if (userContext?.skills?.length)
    contextLines.push(`- Skills: ${userContext.skills.join(", ")}`);
  if (userContext?.interestedFields?.length)
    contextLines.push(`- Interested fields: ${userContext.interestedFields.join(", ")}`);
  if (userContext?.currentRole)
    contextLines.push(`- Current role: ${userContext.currentRole}`);
  if (userContext?.company)
    contextLines.push(`- Company: ${userContext.company}`);

  const contextBlock = contextLines.length > 0
    ? `\nCurrent user context:\n${contextLines.join("\n")}\n`
    : "";

  return `You are LeapBuddy, a warm and helpful AI assistant for Leapmentor — a platform connecting mentors and mentees for 1-on-1 sessions. You are currently helping a ${role}.
${contextBlock}
FAQ Knowledge Base for ${role}s:
${faqText}

INSTRUCTIONS:
- Greet the user by their first name if you know it, but only on the first message.
- Answer questions using the FAQ knowledge base above whenever possible.
- Be warm, concise, and clear — keep answers under 80 words.
- When answering how-to questions or step by step processes, format your answer as a numbered list like 1. 2. 3. for clarity.
- For simple one-line answers, plain sentences are fine — no need to number them.
- Never use markdown symbols like ** or ## — just plain text with numbers.
- If the issue involves any of the following, respond helpfully and end your message with exactly: [ESCALATE]
  * Refund requests or payment disputes
  * Account access, login issues or account deletion
  * Reporting a mentor or mentee for any reason
  * Inappropriate behavior or harassment complaints  
  * Bug reports or technical issues not resolved by basic troubleshooting
  * Any request that requires looking up a specific account or transaction
- Never show [ESCALATE] to the user — it is an internal signal only.
- Never make up policies not present in the FAQ.`;
}

// ─── Typing Dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#94a3b8",
          display: "inline-block",
          animation: `lb-bounce 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes lb-bounce  { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes lb-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lb-popin   { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        @keyframes lb-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,0.4)} 50%{box-shadow:0 0 0 8px rgba(79,70,229,0)} }
        @keyframes lb-slidein { from{opacity:0;transform:translateY(12px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  );
}

// ─── Main LeapBuddy Component ─────────────────────────────────────────────────

export default function LeapBuddy({ role = "mentee", user = null, profile = null }) {
  // Merge user + profile into one context object for the AI
  const userContext = {
    name: user?.name || null,
    email: user?.email || null,
    skills: profile?.skills || [],
    interestedFields: profile?.interestedFields || [],
    currentRole: profile?.currentRole || null,
    company: profile?.company || null,
  };

  const firstName = user?.name?.split(" ")[0] || null;

  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: firstName
        ? `Hey ${firstName}! 👋 I'm LeapBuddy, your AI assistant. Ask me anything about your ${role} account — I'll help instantly!`
        : `Hey there! 👋 I'm LeapBuddy, your AI assistant. Ask me anything about your ${role} account — I'll help instantly!`,
    },
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketForms, setTicketForms] = useState({});
  const [ticketStatus, setTicketStatus] = useState({});

  const bottomRef = useRef(null);

  // Show greeting bubble after 2.5s
  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Auto-hide bubble after 6s
  useEffect(() => {
    if (!showBubble) return;
    const t = setTimeout(() => setShowBubble(false), 6000);
    return () => clearTimeout(t);
  }, [showBubble]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text?.trim() || loading) return;
    const userMsg = { role: "user", text };
    const newHistory = [...history, { role: "user", content: text }];
    setMessages((p) => [...p, userMsg]);
    setHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axiosInstance.post("/ai/chat", {
        messages: newHistory,
        systemPrompt: buildSystemPrompt(role, userContext),
      });
      const raw = data.content?.[0]?.text || "Sorry, I couldn't process that.";
      const needsEscalation = raw.includes("[ESCALATE]");
      const clean = raw.replace("[ESCALATE]", "").trim();
      const msgIdx = messages.length + 1;

      setMessages((p) => [...p, { role: "ai", text: clean, escalate: needsEscalation, msgIdx }]);
      setHistory((p) => [...p, { role: "assistant", content: clean }]);

      if (needsEscalation) {
        setTicketForms((p) => ({ ...p, [msgIdx]: { email: user?.email || "", subject: text.slice(0, 80), message: text } }));
        setTicketStatus((p) => ({ ...p, [msgIdx]: "idle" }));
      }
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "⚠️ Connection issue. Please try again.", escalate: false }]);
    }
    setLoading(false);
  };

  const submitTicket = async (idx) => {
    const form = ticketForms[idx];
    if (!form?.email || !form?.subject || !form?.message) return;
    setTicketStatus((p) => ({ ...p, [idx]: "sending" }));
    try {
      await axiosInstance.post("/support/messages", { ...form, role });
      setTicketStatus((p) => ({ ...p, [idx]: "sent" }));
    } catch {
      setTicketStatus((p) => ({ ...p, [idx]: "error" }));
    }
  };

  const quickChips = role === "mentor"
    ? ["How do I accept a session?", "When do I get paid?", "Set availability"]
    : ["How do I book a mentor?", "Can I get a refund?", "Join my session"];

  LeapBuddy.propTypes = {
    role: PropTypes.oneOf(["mentor", "mentee"]),
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
    }),
    profile: PropTypes.shape({
      skills: PropTypes.arrayOf(PropTypes.string),
      interestedFields: PropTypes.arrayOf(PropTypes.string),
      currentRole: PropTypes.string,
      company: PropTypes.string,
    }),
  };
  return (
    <>
      {/* ── Greeting bubble ── */}
      {showBubble && !open && (
        <button
          onClick={() => { setOpen(true); setShowBubble(false); }}
          style={{
            position: "fixed", bottom: 90, right: 24, zIndex: 9999,
            background: "#fff",
            border: `1.5px solid ${INDIGO_BORDER}`,
            borderRadius: "16px 16px 4px 16px",
            padding: "12px 16px", maxWidth: 230,
            boxShadow: "0 8px 32px rgba(79,70,229,0.15)",
            cursor: "pointer",
            animation: "lb-slidein 0.4s ease",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, lineHeight: 1.5 }}>
            👋 {firstName ? `Hi ${firstName}!` : "Hi there!"} I'm <strong>LeapBuddy</strong>!<br />
            Got a question? Ask me instantly!
          </div>
          <div style={{
            position: "absolute", bottom: -8, right: 16,
            width: 0, height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: `8px solid ${INDIGO_BORDER}`,
          }} />
        </button>
      )}

      {/* ── Floating button ── */}
      <button
        onClick={() => { setOpen((o) => !o); setShowBubble(false); }}
        title="Chat with LeapBuddy"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${INDIGO}, #818cf8)`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
          boxShadow: "0 4px 20px rgba(79,70,229,0.4)",
          animation: open ? "none" : "lb-pulse 2.5s infinite",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {open ? "✕" : "⬡"}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 9998,
          width: 360, height: 520,
          background: "#fff", borderRadius: 20,
          border: `1.5px solid ${INDIGO_BORDER}`,
          boxShadow: "0 16px 48px rgba(79,70,229,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "lb-popin 0.25s ease",
          fontFamily: "'DM Sans', sans-serif",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px",
            background: `linear-gradient(135deg, ${INDIGO}, #818cf8)`,
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>AI</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>LeapBuddy</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                {" "}Online · Instant responses
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([{ role: "ai", text: firstName ? `Hey ${firstName}! 👋 I'm LeapBuddy! How can I help?` : `Hey! 👋 I'm LeapBuddy! How can I help?` }]);
                setHistory([]);
                setTicketForms({});
                setTicketStatus({});
              }}
              style={{
                marginLeft: "auto", background: "rgba(255,255,255,0.2)",
                border: "none", borderRadius: 7, color: "#fff",
                fontSize: 11, padding: "4px 10px", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >Clear</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 12px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {/* Quick chips */}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                {quickChips.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip)} style={{
                    padding: "5px 11px", borderRadius: 20,
                    border: `1px solid ${INDIGO_BORDER}`,
                    background: INDIGO_LIGHT, color: INDIGO,
                    fontSize: 11, cursor: "pointer",
                    fontFamily: "inherit", fontWeight: 500,
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e0e7ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = INDIGO_LIGHT; }}
                  >{chip}</button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const tStatus = ticketStatus[msg.msgIdx];
              return (
                <div key={idx} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                  animation: "lb-fadein 0.2s ease",
                }}>
                  <div style={{
                    maxWidth: "82%", padding: "9px 13px",
                    borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: isUser ? INDIGO : "#f8fafc",
                    color: isUser ? "#fff" : "#334155",
                    fontSize: 13, lineHeight: 1.6,
                    border: isUser ? "none" : "1px solid #e2e8f0",
                    whiteSpace: "pre-wrap",
                  }}>
                    {msg.text}
                  </div>

                  {/* Escalation ticket form */}
                  {msg.escalate && tStatus !== undefined && (
                    <div style={{
                      marginTop: 7, maxWidth: "82%", background: "#fff",
                      border: `1.5px solid ${INDIGO_BORDER}`,
                      borderLeft: `4px solid ${INDIGO}`,
                      borderRadius: 10, padding: "12px 14px", fontSize: 12,
                    }}>
                      {tStatus === "sent" ? (
                        <div style={{ color: "#16a34a", fontWeight: 600 }}>
                          ✅ Ticket submitted! We'll reply within 24 hours.
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>🎫 Submit a support ticket</div>
                          <div style={{ color: "#64748b", marginBottom: 8, fontSize: 11 }}>This needs a human review. We'll get back to you soon.</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <input type="email" placeholder="Your email"
                              value={ticketForms[msg.msgIdx]?.email || ""}
                              onChange={(e) => setTicketForms((p) => ({ ...p, [msg.msgIdx]: { ...p[msg.msgIdx], email: e.target.value } }))}
                              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 11, outline: "none", fontFamily: "inherit" }}
                            />
                            <input placeholder="Subject"
                              value={ticketForms[msg.msgIdx]?.subject || ""}
                              onChange={(e) => setTicketForms((p) => ({ ...p, [msg.msgIdx]: { ...p[msg.msgIdx], subject: e.target.value } }))}
                              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 11, outline: "none", fontFamily: "inherit" }}
                            />
                            <textarea rows={2} placeholder="Describe your issue..."
                              value={ticketForms[msg.msgIdx]?.message || ""}
                              onChange={(e) => setTicketForms((p) => ({ ...p, [msg.msgIdx]: { ...p[msg.msgIdx], message: e.target.value } }))}
                              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 11, outline: "none", resize: "none", fontFamily: "inherit" }}
                            />
                            {tStatus === "error" && <p style={{ color: "#ef4444", fontSize: 10, margin: 0 }}>Failed. Please try again.</p>}
                            <button onClick={() => submitTicket(msg.msgIdx)}
                              disabled={tStatus === "sending"}
                              style={{
                                padding: "7px 12px", borderRadius: 7,
                                background: tStatus === "sending" ? "#a5b4fc" : INDIGO,
                                color: "#fff", border: "none", fontSize: 11,
                                fontWeight: 600, cursor: tStatus === "sending" ? "not-allowed" : "pointer",
                                fontFamily: "inherit", alignSelf: "flex-start",
                              }}>
                              {tStatus === "sending" ? "Submitting..." : "📨 Submit to Admin"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div>
                <div style={{
                  display: "inline-block", background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px 14px 14px 4px", padding: "9px 13px",
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #f1f5f9",
            display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask LeapBuddy anything..."
              rows={1} disabled={loading}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10,
                border: "1.5px solid #e2e8f0", fontSize: 13,
                outline: "none", resize: "none", fontFamily: "inherit",
                color: "#0f172a", lineHeight: 1.5, maxHeight: 80,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = INDIGO; }}
              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: loading || !input.trim() ? "#e2e8f0" : INDIGO,
                border: "none",
                color: loading || !input.trim() ? "#94a3b8" : "#fff",
                fontSize: 15, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}
            >➤</button>
          </div>
        </div>
      )}
    </>
  );
}