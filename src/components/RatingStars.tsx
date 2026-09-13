import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { colors } from "@/theme/colors";

interface RatingStarsProps {
  value: number; // 0-5, aceita meios pontos no modo somente-leitura
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

// Exibe (ou coleta, no modo interativo) uma nota de 0 a 5 estrelas.
export function RatingStars({ value, size = 14, interactive = false, onChange }: RatingStarsProps) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((slot) => {
        const isFilled = value >= slot;
        const isHalf = !isFilled && value >= slot - 0.5;
        const iconName = isFilled ? "star" : isHalf ? "star-half" : "star-outline";

        if (!interactive) {
          return <Ionicons key={slot} name={iconName} size={size} color={colors.accent} />;
        }

        return (
          <Pressable key={slot} onPress={() => onChange?.(slot)} hitSlop={6}>
            <Ionicons
              name={value >= slot ? "star" : "star-outline"}
              size={size}
              color={colors.accent}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
