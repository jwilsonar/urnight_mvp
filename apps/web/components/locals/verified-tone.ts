export const VERIFIED_TONE_ORDER = [
  "green",
  "blue",
  "gold",
  "crimson",
] as const;

export type VerifiedTone = (typeof VERIFIED_TONE_ORDER)[number];

export const VERIFIED_TONE_STYLES: Record<
  VerifiedTone,
  { badge: string; icon: string; panel: string }
> = {
  green: {
    badge:
      "bg-[#f0fdf4] text-[#15803d] ring-[#ffffff] dark:bg-[#052e16] dark:text-[#4ade80] dark:ring-[#16181b]",
    icon: "text-[#15803d] dark:text-[#4ade80]",
    panel:
      "border-[#15803d]/30 bg-[#f0fdf4] dark:border-[#4ade80]/35 dark:bg-[#052e16]/55",
  },
  blue: {
    badge:
      "bg-[#eff6ff] text-[#1d4ed8] ring-[#ffffff] dark:bg-[#172554] dark:text-[#60a5fa] dark:ring-[#16181b]",
    icon: "text-[#1d4ed8] dark:text-[#60a5fa]",
    panel:
      "border-[#1d4ed8]/30 bg-[#eff6ff] dark:border-[#60a5fa]/35 dark:bg-[#172554]/55",
  },
  gold: {
    badge:
      "bg-[#fffbeb] text-[#a16207] ring-[#ffffff] dark:bg-[#422006] dark:text-[#fbbf24] dark:ring-[#16181b]",
    icon: "text-[#a16207] dark:text-[#fbbf24]",
    panel:
      "border-[#a16207]/30 bg-[#fffbeb] dark:border-[#fbbf24]/35 dark:bg-[#422006]/55",
  },
  crimson: {
    badge:
      "bg-[#fff1f2] text-[#ea0526] ring-[#ffffff] dark:bg-[#2e0710] dark:text-[#ff4560] dark:ring-[#16181b]",
    icon: "text-[#ea0526] dark:text-[#ff4560]",
    panel:
      "border-[#ea0526]/30 bg-[#fff1f2] dark:border-[#ff4560]/35 dark:bg-[#2e0710]/55",
  },
};

// Temporal: distribuye los cuatro tonos mientras producto elige el definitivo.
export function verifiedToneForSlug(slug: string): VerifiedTone {
  let hash = 5381;
  for (const character of slug) {
    hash = ((hash * 33) ^ character.charCodeAt(0)) >>> 0;
  }
  return VERIFIED_TONE_ORDER[hash % VERIFIED_TONE_ORDER.length]!;
}
