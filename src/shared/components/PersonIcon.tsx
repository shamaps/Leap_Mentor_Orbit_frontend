// src/components/common/PersonIcon.jsx
const PersonIcon = ({
    size = 13,
    stroke = "white",
    strokeWidth = "2",
    testId = "person-icon",
}) => (
    <svg
        data-testid={testId}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);


export default PersonIcon;