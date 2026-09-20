import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { AccountModal } from "@/components/AccountModal";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

// Iniciais no header em vez de um ícone genérico — dá pra reconhecer a
// própria conta de relance. Abre o AccountModal com os detalhes/Sair.
export function AccountButton() {
  const { displayName } = useAuth();
  const [isOpen, setOpen] = useState(false);
  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.initial}>{initial}</Text>
      </Pressable>

      <AccountModal visible={isOpen} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  initial: {
    fontSize: 12,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
});
