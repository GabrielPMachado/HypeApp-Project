import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";

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

// Ícone que representa cada característica — usado como "marca" visual
// do local (ver VenueAvatar) enquanto não há logo real cadastrada.
export const VIBE_TAG_ICONS: Record<VibeTag, ComponentProps<typeof Feather>["name"]> = {
  samba: "music",
  rock: "headphones",
  eletronica: "disc",
  "para-dancar": "activity",
  "para-conversar": "message-circle",
};
