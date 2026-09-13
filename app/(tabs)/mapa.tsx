import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

// Placeholder do Mapa de Calor (README). A integração real com
// react-native-maps + Google Maps API entra numa etapa futura.
export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name="map-pin" size={22} color={colors.accent} />
      </View>
      <Text style={styles.title}>Mapa de calor</Text>
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
    gap: 10,
    padding: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
