import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

// Versão web da aba Mapa. react-native-maps não tem NENHUMA implementação
// pra navegador — nem a tela em si: o simples "import" do pacote já quebra
// o bundle web (ele chama uma função de codegen que só existe em React
// Native puro). Por isso esse fallback mora num arquivo à parte que nunca
// importa react-native-maps — o Metro escolhe este arquivo (".web.tsx")
// pra plataforma web e mapa.tsx pra iOS/Android automaticamente.
export default function MapaWebScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name="map-pin" size={22} color={colors.accent} />
      </View>
      <Text style={styles.title}>Mapa de calor</Text>
      <Text style={styles.subtitle}>
        O mapa interativo só funciona no app instalado no celular — o
        navegador não tem essa peça. Abra pelo celular pra ver, ou use a
        aba Lista por aqui.
      </Text>
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
