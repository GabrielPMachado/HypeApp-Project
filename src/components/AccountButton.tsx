import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { ProfileModal } from "@/components/ProfileModal";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";

// O avatar da própria pessoa no header — reconhecível de relance (emoji e
// moldura equipados). Abre o perfil completo.
export function AccountButton() {
  const { displayName, profile } = useAuth();
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <UserAvatar
          name={displayName}
          avatarId={profile?.avatarId}
          frameId={profile?.frameId}
          size={32}
        />
      </Pressable>

      <ProfileModal visible={isOpen} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
