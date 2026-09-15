// src/constants/mentorshipPrefs.ts
export interface CommOption {
  value: string;
  label: string;
  icon: string;
}

export const COMM_OPTIONS: CommOption[] = [
  { value: "Chat", label: "Chat", icon: "💬" },
  { value: "Video Call", label: "Video Call", icon: "🎥" },
  { value: "Email", label: "Email", icon: "✉️" },
  { value: "Phone Call", label: "Phone Call", icon: "📞" },
  { value: "In-Person", label: "In-Person", icon: "🤝" },
];

// Derived lookup so the card only needs { value: icon }
export const COMM_ICONS: Record<string, string> = COMM_OPTIONS.reduce(
  (acc: Record<string, string>, { value, icon }) => {
    acc[value] = icon;
    return acc;
  },
  {},
);

// 20 professional languages — no free text allowed
export const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Spanish", "French", "German",
  "Mandarin", "Arabic", "Portuguese", "Japanese", "Korean",
  "Italian", "Russian", "Dutch", "Turkish", "Swedish",
  "Polish", "Indonesian", "Bengali", "Tamil", "Urdu",
];