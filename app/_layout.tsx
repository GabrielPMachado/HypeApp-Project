import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthScreen } from "@/components/AuthScreen";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { VenuesProvider } from "@/context/VenuesContext";
import { isFirebaseConfigured } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontsToLoad } from "@/theme/typography";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Portão de entrada do app: sem conta autenticada, só existe a
// AuthScreen — as abas nem montam. Sem Firebase configurado (.env
// vazio) pula o gate direto, senão quem clona o repo sem credenciais
// fica preso numa tela de login que não tem como completar (ver
// isFirebaseConfigured em services/firebase.ts, mesmo princípio do
// fallback pro mock usado no resto do app).
function RootNavigator() {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  // user?.isAnonymous: sessões anônimas de antes desta etapa (login
  // opcional) continuam persistidas no AsyncStorage do device e voltam
  // sozinhas aqui via onAuthStateChanged — não contam como "logado" pra
  // login obrigatório, senão o gate nunca aparece em quem já usou o app.
  if (isFirebaseConfigured && (!user || user.isAnonymous)) {
    return <AuthScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LocationProvider>
          <VenuesProvider>
            {/* Por dentro dos outros providers de propósito: o conteúdo de
                um BottomSheetModal é renderizado num portal na posição
                deste provider (não onde o sheet é declarado) — se ele
                ficasse acima, tudo dentro dos sheets perderia os
                contextos (useAuth, useVenues...). */}
            <BottomSheetModalProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </BottomSheetModalProvider>
          </VenuesProvider>
        </LocationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
