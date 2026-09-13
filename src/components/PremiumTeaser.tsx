import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface PremiumTeaserProps {
  title: string;
  description: string;
}

// Espaço reservado pra features do plano Premium (ex: histórico do hype
// ao longo da noite) — mostra o valor sem construir a feature ainda.
export function PremiumTeaser({ title, description }: PremiumTeaserProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name="lock" size={14} color={colors.accent} />
      </View>
      <View style={styles.textColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Premium</Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  description: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
