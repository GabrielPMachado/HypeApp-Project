import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Cores da borda neon — o gradiente gira continuamente por trás, então a
// última cor repete a primeira pra fechar o loop sem "costura" visível.
// Exportado pra dar pra reaproveitar a mesma paleta em lugares que não
// suportam a animação em si (ex: marcador do mapa, ver app/(tabs)/mapa.tsx).
export const NEON_COLORS = ["#E8B24D", "#FF3DBB", "#7C4DFF", "#33D9FF", "#E8B24D"] as const;

interface NeonBorderProps {
  active: boolean;
  borderRadius: number;
  borderWidth?: number;
  children: ReactNode;
}

// Envolve "children" (de qualquer tamanho — mede via onLayout, não
// precisa ser quadrado) com um anel de gradiente neon girando sem parar
// por trás. Só a borda fica visível porque o próprio conteúdo (opaco)
// cobre o miolo, deixando uma faixa de "borderWidth" à mostra.
// Quando "active" é false, não faz nada — renderiza os filhos direto,
// sem o custo de medir layout nem rodar a animação.
export function NeonBorder({ active, borderRadius, borderWidth = 2, children }: NeonBorderProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      rotation.value = 0; // solta o ângulo (e cancela o loop) se deixar de ser líder
      return;
    }
    rotation.value = withRepeat(withTiming(360, { duration: 3200, easing: Easing.linear }), -1);
  }, [active, rotation]);

  // useAnimatedStyle precisa rodar em TODO render, senão o número de
  // hooks muda quando "active" alterna (ex: o ranking reordena e outro
  // local vira líder) — React acusa "Rendered more hooks than during
  // the previous render" se esse hook vier depois de um return condicional.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!active) return <>{children}</>;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  // O anel precisa cobrir a diagonal inteira do retângulo em qualquer
  // ângulo de rotação, não só a maior dimensão.
  const diagonal = Math.sqrt(size.width ** 2 + size.height ** 2);
  const ringSize = diagonal * 1.15;

  return (
    <View onLayout={handleLayout} style={[styles.outer, { borderRadius }]}>
      {size.width > 0 && (
        <Animated.View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              left: (size.width - ringSize) / 2,
              top: (size.height - ringSize) / 2,
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={NEON_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      <View style={{ margin: borderWidth }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
  },
  ring: {
    position: "absolute",
  },
});
