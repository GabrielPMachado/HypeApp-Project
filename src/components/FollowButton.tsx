import { Feather } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface FollowButtonProps {
  targetUid: string;
}

// Estado "eu sigo essa pessoa?" em tempo real (ver followUser/unfollowUser
// em AuthContext.tsx) — onSnapshot no próprio documento da relação, que o
// Firestore atualiza no instante da escrita local (antes do servidor
// confirmar): o botão troca de estado no toque, sem "girando". Se o
// servidor recusar, o snapshot volta sozinho pro estado anterior.
export function FollowButton({ targetUid }: FollowButtonProps) {
  const { user, followUser, unfollowUser } = useAuth();
  const [isFollowing, setFollowing] = useState<boolean | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!db || !user || user.uid === targetUid) {
      setFollowing(null);
      return;
    }

    return onSnapshot(doc(db, "users", user.uid, "following", targetUid), (snap) => {
      setFollowing(snap.exists());
    });
  }, [user, targetUid]);

  // Sem perfil próprio carregado ainda, ou é o próprio usuário: não faz
  // sentido mostrar "seguir a si mesmo".
  if (!user || user.uid === targetUid || isFollowing === null) return null;

  const handlePress = async () => {
    setSubmitting(true);
    try {
      if (isFollowing) await unfollowUser(targetUid);
      else await followUser(targetUid);
    } catch {
      // Recusado (rede/regras): o snapshot já desfez a mudança na tela.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isSubmitting}
      accessibilityRole="button"
      accessibilityLabel={isFollowing ? "Deixar de seguir" : "Seguir"}
      style={[styles.button, isFollowing ? styles.buttonFollowing : styles.buttonNotFollowing]}
    >
      <Feather
        name={isFollowing ? "check" : "user-plus"}
        size={14}
        color={isFollowing ? colors.text : colors.background}
      />
      <Text style={[styles.text, isFollowing ? styles.textFollowing : styles.textNotFollowing]}>
        {isFollowing ? "Seguindo" : "Seguir"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 110,
  },
  buttonNotFollowing: {
    backgroundColor: colors.accent,
  },
  buttonFollowing: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  text: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
  },
  textNotFollowing: {
    color: colors.background,
  },
  textFollowing: {
    color: colors.text,
  },
});
