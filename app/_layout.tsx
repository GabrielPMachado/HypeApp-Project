import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { VenuesProvider } from "@/context/VenuesContext";

export default function RootLayout() {
  return (
    <VenuesProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </VenuesProvider>
  );
}
