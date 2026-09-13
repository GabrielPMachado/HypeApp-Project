import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

// Sistema tipográfico do app. Space Grotesk para títulos/wordmark (dá
// personalidade e um ar mais editorial/tech) e Inter para texto de UI
// (alta legibilidade em telas pequenas). Carregadas em app/_layout.tsx
// via useFonts, antes de esconder a splash screen.
export const fontFamily = {
  display: "SpaceGrotesk_700Bold",
  displayMedium: "SpaceGrotesk_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
} as const;

export const fontsToLoad = {
  SpaceGrotesk_700Bold,
  SpaceGrotesk_500Medium,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};
