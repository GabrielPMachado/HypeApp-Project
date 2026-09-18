import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useVenues } from "@/context/VenuesContext";
import { isFirebaseConfigured } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { CityLocation } from "@/types/location";

interface AppHeaderProps {
  location: CityLocation;
  onOpenLocationPicker: () => void;
  subtitle?: ReactNode;
}

// Cabeçalho compartilhado pelas duas abas (Lista e Mapa): wordmark,
// botão de recarregar dados mockados (só em dev) e o seletor de
// região. Cada tela só passa a linha de legenda embaixo (subtitle) —
// "Ranking de agora · N locais" numa, algo equivalente na outra.
export function AppHeader({ location, onOpenLocationPicker, subtitle }: AppHeaderProps) {
  const { reloadMockData, seedFirestoreFromMock } = useVenues();

  const handleSeed = () => {
    seedFirestoreFromMock()
      .then(() => Alert.alert("Seed feito", "mockVenues.ts foi gravado em venues/ no Firestore."))
      .catch((error: Error) =>
        Alert.alert("Falhou", `${error.message}\n\nA regra de escrita em "venues" está aberta?`)
      );
  };

  return (
    <View style={styles.header}>
      <View style={styles.wordmarkRow}>
        <View style={styles.wordmarkDot} />
        <Text style={styles.wordmark}>HYPEAPP</Text>

        {/* Só em dev: o Fast Refresh atualiza o código na hora, mas o
            useState que guarda os venues só lê mockVenues.ts uma vez —
            editar o arquivo não aparece sozinho na tela (ver
            reloadMockData em VenuesContext.tsx). Esse botão relê os
            dados sem precisar dar reload completo do app. Some sozinho
            quando o Firestore está configurado (não tem "mock" local
            pra recarregar nesse modo). */}
        {__DEV__ && !isFirebaseConfigured && (
          <Pressable
            onPress={reloadMockData}
            hitSlop={8}
            style={({ pressed }) => [styles.devReloadButton, pressed && styles.devReloadButtonPressed]}
          >
            <Feather name="refresh-cw" size={13} color={colors.textFaint} />
          </Pressable>
        )}

        {/* Só em dev, só com Firestore configurado: popula "venues/" a
            partir do mockVenues.ts atual (ver seedFirestoreFromMock em
            VenuesContext.tsx) — precisa da regra de escrita liberada
            temporariamente, ver plano do backend. */}
        {__DEV__ && isFirebaseConfigured && (
          <Pressable
            onPress={handleSeed}
            hitSlop={8}
            style={({ pressed }) => [styles.devReloadButton, pressed && styles.devReloadButtonPressed]}
          >
            <Feather name="upload-cloud" size={13} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={onOpenLocationPicker}
        style={({ pressed }) => [styles.locationButton, pressed && styles.locationButtonPressed]}
      >
        <Feather name="map-pin" size={13} color={colors.accent} />
        <Text style={styles.locationText} numberOfLines={1}>
          {location.city ? `${location.neighborhood}, ${location.city}` : location.neighborhood}
        </Text>
        <Feather name="chevron-down" size={14} color={colors.textFaint} />
      </Pressable>

      {subtitle}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  wordmark: {
    fontSize: 20,
    fontFamily: fontFamily.display,
    color: colors.text,
    letterSpacing: 0.5,
  },
  devReloadButton: {
    marginLeft: "auto",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devReloadButtonPressed: {
    opacity: 0.7,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  locationButtonPressed: {
    opacity: 0.7,
  },
  locationText: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
});

export const subtitleStyles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
});
