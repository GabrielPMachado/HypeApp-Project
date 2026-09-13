import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

// Placeholder do Mapa de Calor (README). A integração real com
// react-native-maps + Google Maps API entra numa etapa futura.
export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={styles.title}>Mapa de Calor</Text>
      <Text style={styles.subtitle}>Em breve — por enquanto, use a aba Lista.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 6,
    padding: 24,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});
