import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
}

// Dentro do app o usuário está sempre autenticado (ver gate em
// app/_layout.tsx) — esse modal só mostra quem é e deixa sair, não
// precisa lidar com o caso "deslogado" (isso é a AuthScreen).
export function AccountModal({ visible, onClose }: AccountModalProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile?.displayName ?? "?").charAt(0).toUpperCase()}</Text>
          </View>

          <Text style={styles.name}>{profile?.displayName ?? "Sem nome"}</Text>
          <Text style={styles.email}>{profile?.email ?? ""}</Text>

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
          >
            <Text style={styles.signOutText}>Sair</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fontFamily.display,
    color: colors.accent,
  },
  name: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
    textAlign: "center",
  },
  email: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    marginBottom: 18,
  },
  signOutButton: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 13,
  },
  signOutButtonPressed: {
    opacity: 0.75,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.hypeHigh,
  },
});
