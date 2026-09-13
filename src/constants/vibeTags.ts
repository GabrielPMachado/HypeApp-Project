import type { VibeTag } from "@/types/venue";

export const ALL_VIBE_TAGS: VibeTag[] = [
  "samba",
  "rock",
  "eletronica",
  "para-dancar",
  "para-conversar",
];

export const VIBE_TAG_LABELS: Record<VibeTag, string> = {
  samba: "Samba",
  rock: "Rock",
  eletronica: "Eletrônica",
  "para-dancar": "Para Dançar",
  "para-conversar": "Para Conversar",
};
