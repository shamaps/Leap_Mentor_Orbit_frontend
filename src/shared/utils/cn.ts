// src/shared/utils/cn.ts
// Minimal className joiner — filters falsy values, no extra dependency needed
// since we don't have conflicting Tailwind classes to dedupe here yet.
export const cn = (...classes: Array<string | false | null | undefined>): string =>
    classes.filter(Boolean).join(" ");