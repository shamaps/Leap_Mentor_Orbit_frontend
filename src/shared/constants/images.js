// src/constants/images.js
// Centralized image paths — avoids the same string literal
// ("/images/logo.webp") being duplicated across 11+ components.

export const IMAGES = {
    logo: "/images/logo.webp",
    logoPng: "/images/logo.png",       // used where .webp isn't loaded, e.g. onboarding shells
    loginHero: "/images/login.webp",
    verifyHero: "/images/imageverify.webp",
    mentorBg: "/images/mentor-bg.jpg",
    menteeBg: "/images/mentee-bg.jpg",
    heroCarousel: [
        "/images/mentor3.webp",
        "/images/mentor4.webp",
        "/images/mentor2.webp",
    ],
};