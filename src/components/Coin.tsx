import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

interface CoinProps {
  size?: number;
}

// A moeda do jogo: disco dourado em degradê com o raio do Hype no meio
// (o mesmo símbolo do ícone do app). Desenhada em vez de emoji pra ficar
// igual em qualquer celular.
export function Coin({ size = 18 }: CoinProps) {
  const rim = Math.max(1, size * 0.07);
  const inner = size - rim * 2;

  return (
    <LinearGradient
      colors={["#FFE9A8", "#E8B24D", "#B9801F"]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View
        style={[
          styles.inner,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            borderWidth: Math.max(1, size * 0.045),
          },
        ]}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={size * 0.58} color="#8A5A0E" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(138, 90, 14, 0.35)",
    backgroundColor: "rgba(255, 233, 168, 0.35)",
  },
});
