// src/components/shared-dashboard/tabs/SharedChatTab.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import useChat from "@/features/shared-dashboard/presenter/useChat";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { selectConnect } from "@/app/store/selectors";
// ── Helpers ───────────────────────────────────────────────────
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  "linear-gradient(135deg, #10b981, #047857)",
  "linear-gradient(135deg, #f59e0b, #b45309)",
];
const getGradient = (name = "") =>
  GRADIENTS[name.codePointAt(0) % GRADIENTS.length];

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateSeparator = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isSameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

// ── Avatar ────────────────────────────────────────────────────
const Avatar = ({ name, picture, size = 32 }) => {
  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid #f1f5f9",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: getGradient(name),
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "700",
        fontSize: size < 36 ? "11px" : "14px",
      }}
    >
      {getInitials(name)}
    </div>
  );
};
Avatar.propTypes = {
  name: PropTypes.string,
  picture: PropTypes.string,
  size: PropTypes.number,
};
// ── Chat Header ───────────────────────────────────────────────
const ChatHeader = ({ name, picture, otherOnline }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "14px 20px",
      borderBottom: "1px solid #f1f5f9",
      backgroundColor: "white",
      flexShrink: 0,
    }}
  >
    <div style={{ position: "relative" }}>
      <Avatar name={name} picture={picture} size={38} />
      <span
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: otherOnline ? "#22c55e" : "#cbd5e1",
          border: "2px solid white",
        }}
      />
    </div>
    <div>
      <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
        {name}
      </p>
      <p
        style={{
          fontSize: "11px",
          color: otherOnline ? "#22c55e" : "#94a3b8",
          fontWeight: "500",
        }}
      >
        {otherOnline ? "Online" : "Offline"}
      </p>
    </div>
  </div>
);
ChatHeader.propTypes = {
  name: PropTypes.string,
  picture: PropTypes.string,
  otherOnline: PropTypes.bool,
};
// ── Date Separator ────────────────────────────────────────────
const DateSeparator = ({ dateStr }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      margin: "12px 0",
    }}
  >
    <div style={{ flex: 1, height: "1px", backgroundColor: "#f1f5f9" }} />
    <span
      style={{
        fontSize: "10px",
        fontWeight: "600",
        color: "#94a3b8",
        padding: "2px 10px",
        borderRadius: "999px",
        backgroundColor: "#f8fafc",
        border: "1px solid #f1f5f9",
        whiteSpace: "nowrap",
      }}
    >
      {formatDateSeparator(dateStr)}
    </span>
    <div style={{ flex: 1, height: "1px", backgroundColor: "#f1f5f9" }} />
  </div>
);
DateSeparator.propTypes = {
  dateStr: PropTypes.string.isRequired,
};
// ── Read Receipt ──────────────────────────────────────────────
const ReadReceipt = ({ readAt }) => (
  <span style={{ marginLeft: "4px", color: readAt ? "#2563eb" : "#94a3b8" }}>
    {readAt ? (
      <svg width="14" height="9" viewBox="0 0 16 10" fill="none">
        <path
          d="M1 5l3.5 3.5L11 1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 5l3.5 3.5L15 1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg width="10" height="9" viewBox="0 0 10 10" fill="none">
        <path
          d="M1 5l3 3L9 1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </span>
);
ReadReceipt.propTypes = {
  readAt: PropTypes.string,
};
// ── Message Bubble ────────────────────────────────────────────
const MessageBubble = ({ message, isOwn, otherName, otherPicture }) => (
  <div
    style={{
      display: "flex",
      flexDirection: isOwn ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: "8px",
      marginBottom: "4px",
    }}
  >
    {!isOwn && <Avatar name={otherName} picture={otherPicture} size={28} />}
    <div
      style={{
        maxWidth: "68%",
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          padding: "9px 13px",
          borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          backgroundColor: isOwn ? "#2563eb" : "white",
          border: isOwn ? "none" : "1px solid #e2e8f0",
          color: isOwn ? "white" : "#1e293b",
          fontSize: "13px",
          lineHeight: "1.5",
          wordBreak: "break-word",
          boxShadow: isOwn ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {message.content}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          marginTop: "3px",
        }}
      >
        <span style={{ fontSize: "10px", color: "#94a3b8" }}>
          {formatTime(message.createdAt)}
        </span>
        {isOwn && <ReadReceipt readAt={message.readAt} />}
      </div>
    </div>
  </div>
);
MessageBubble.propTypes = {
  message: PropTypes.shape({
    content: PropTypes.string,
    createdAt: PropTypes.string,
    readAt: PropTypes.string,
  }).isRequired,
  isOwn: PropTypes.bool,
  otherName: PropTypes.string,
  otherPicture: PropTypes.string,
};
// ── Typing Indicator ──────────────────────────────────────────
const TypingIndicator = ({ name }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "4px 0",
    }}
  >
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "18px 18px 18px 4px",
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#94a3b8",
            display: "inline-block",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
      {name} is typing...
    </span>
    <style>{`
      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-5px); }
      }
    `}</style>
  </div>
);
TypingIndicator.propTypes = {
  name: PropTypes.string,
};
// ── Load More ─────────────────────────────────────────────────
const LoadMoreButton = ({ onClick, loading }) => (
  <div
    style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}
  >
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "6px 16px",
        borderRadius: "999px",
        border: "1px solid #e2e8f0",
        backgroundColor: "white",
        fontSize: "11px",
        fontWeight: "600",
        color: "#64748b",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "all 0.15s",
      }}
    >
      {loading ? "Loading..." : "Load older messages"}
    </button>
  </div>
);
LoadMoreButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
// ── Empty State ───────────────────────────────────────────────
const EmptyState = ({ otherName }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      textAlign: "center",
      padding: "40px",
    }}
  >
    <div
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "16px",
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
    <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
      No messages yet
    </p>
    <p
      style={{
        fontSize: "12px",
        color: "#94a3b8",
        maxWidth: "220px",
        lineHeight: "1.6",
      }}
    >
      Start the conversation with {otherName}!
    </p>
  </div>
);
EmptyState.propTypes = {
  otherName: PropTypes.string,
};
// ── Chat Input ────────────────────────────────────────────────
const ChatInput = ({ onSend, onTyping, disabled }) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    onTyping();
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
        padding: "12px 20px",
        borderTop: "1px solid #f1f5f9",
        backgroundColor: "white",
        flexShrink: 0,
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          outline: "none",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: "13px",
          color: "#1e293b",
          backgroundColor: "#f8fafc",
          lineHeight: "1.5",
          maxHeight: "120px",
          fontFamily: "inherit",
          overflow: "hidden",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#93c5fd")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          backgroundColor: value.trim() ? "#2563eb" : "#f1f5f9",
          border: "none",
          cursor: value.trim() ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={value.trim() ? "white" : "#94a3b8"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
};
ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  onTyping: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
// ── Main ──────────────────────────────────────────────────────
const SharedChatTab = () => {
  const connect = useSelector(selectConnect);
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    isTyping,
    otherOnline,
    sendMessage,
    loadMore,
    handleTyping,
    markRead,
  } = useChat(connect?._id);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevScrollHeight = useRef(0);

  // ── Determine other person ──────────────────────────────
  const viewerRole = connect?.viewerRole;
  const myId =
    viewerRole === "mentee"
      ? connect?.mentee?._id?.toString()
      : connect?.mentor?._id?.toString();

  const isOwn = (msg) => {
    const sid = msg.sender?._id?.toString() || msg.sender?.toString();
    return sid === myId;
  };

  const otherName =
    viewerRole === "mentee"
      ? connect?.mentor?.name || "Mentor"
      : connect?.mentee?.name || "Mentee";
  const otherPicture =
    viewerRole === "mentee"
      ? connect?.mentorProfile?.profilePicture || ""
      : connect?.menteeProfile?.profilePicture || "";

  // ── Scroll to bottom on load ────────────────────────────
  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading, scrollToBottom]);

  // ── Auto scroll on new message if near bottom ───────────
  useEffect(() => {
    if (messages.length === 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      120;
    if (nearBottom) scrollToBottom(true);
  }, [messages, scrollToBottom]);

  // ── Preserve scroll when loading older messages ─────────
  useEffect(() => {
    if (!loadingMore) {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight - prevScrollHeight.current;
    }
  }, [loadingMore]);

  const handleLoadMore = () => {
    const container = scrollContainerRef.current;
    if (container) prevScrollHeight.current = container.scrollHeight;
    loadMore();
  };

  // ── Mark read on focus ──────────────────────────────────
  useEffect(() => {
    markRead();
    const onFocus = () => markRead();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markRead]);

  if (loading) {
    return (
      <div
        style={{
          // Fills parent flex container while loading
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "3px solid #bfdbfe",
              borderTopColor: "#2563eb",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Loading messages...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    /*
      KEY LAYOUT CHANGES vs original:
      ─────────────────────────────────────────────────────────────
      1. Removed fixed `height: "calc(100vh - 120px)"` — this was
         the main culprit for clipping or not filling properly.
         Replaced with `flex: 1` so it stretches to fill whatever
         height the parent content area provides.

      2. Added `width: "100%"` — ensures full horizontal stretch
         with no dead whitespace on the right.

      3. `minHeight: 0` on the outer div — critical for nested flex
         children to scroll correctly inside a flex parent. Without
         this, the browser won't constrain the height and the
         messages area won't scroll; it'll overflow instead.

      4. Padding on header/input bumped from 16px → 20px horizontal
         to match a balanced 20px breathing room on all sides,
         consistent with industry-standard chat UIs (Slack, Linear).

      Your parent layout (the content area wrapper) should be:
        display: "flex", flexDirection: "column", height: "100%"
      or using Tailwind: className="flex flex-col h-full"
      so this component's `flex: 1` has something to expand into.
      ─────────────────────────────────────────────────────────────
    */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        width: "80%",
        minHeight: 0,
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        overflow: "hidden",
        margin: "0 auto", // ← centers the div, giving equal left & right spacing
      }}
    >
      <ChatHeader
        name={otherName}
        picture={otherPicture}
        otherOnline={otherOnline}
      />

      {error && (
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#fef2f2",
            borderBottom: "1px solid #fecaca",
            fontSize: "12px",
            color: "#dc2626",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px", // ← balanced 20px horizontal padding
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8fafc",
          minHeight: 0, // ← same fix at scroll container level
        }}
      >
        {hasMore && (
          <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />
        )}
        {messages.length === 0 && <EmptyState otherName={otherName} />}

        {messages.map((msg, index) => {
          const prev = messages[index - 1];
          const showSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
          return (
            <div key={msg._id}>
              {showSep && <DateSeparator dateStr={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isOwn={isOwn(msg)}
                otherName={otherName}
                otherPicture={otherPicture}
              />
            </div>
          );
        })}

        {isTyping && <TypingIndicator name={otherName} />}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        onTyping={handleTyping}
        disabled={!!error}
      />
    </div>
  );
};

export default SharedChatTab;
