// src/constants/mentorshipPrefs.js
export const COMM_OPTIONS = [
  { value: "Chat", label: "Chat", icon: "💬" },
  { value: "Video Call", label: "Video Call", icon: "🎥" },
  { value: "Email", label: "Email", icon: "✉️" },
  { value: "Phone Call", label: "Phone Call", icon: "📞" },
  { value: "In-Person", label: "In-Person", icon: "🤝" },
];

// Derived lookup so the card only needs { value: icon }
export const COMM_ICONS = COMM_OPTIONS.reduce((acc, { value, icon }) => {
  acc[value] = icon;
  return acc;
}, {});

// 20 professional languages — no free text allowed
export const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Spanish", "French", "German",
  "Mandarin", "Arabic", "Portuguese", "Japanese", "Korean",
  "Italian", "Russian", "Dutch", "Turkish", "Swedish",
  "Polish", "Indonesian", "Bengali", "Tamil", "Urdu",
];