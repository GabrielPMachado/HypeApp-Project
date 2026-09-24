import { Feather } from "@expo/vector-icons";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PublicProfileModal } from "@/components/PublicProfileModal";
import { UserAvatar } from "@/components/UserAvatar";
import { DEFAULT_AVATAR_ID, DEFAULT_FRAME_ID } from "@/data/storeCatalog";
import { db } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface ListedUser {
  uid: string;
  displayName: string;
  avatarId: string;
  frameId: string;
}

interface UserListModalProps {
  visible: boolean;
  onClose: () => void;
  uid: string;
  relation: "following" | "followers";
  title: string;
}

// Lista de quem uid segue (ou de quem segue uid) — a subcoleção só guarda
// o id de cada relação (ver followUser em AuthContext.tsx), então cada
// linha busca o perfil público de verdade em users/{id} pra mostrar nome
// e avatar. Tocar num nome abre o perfil público da pessoa.
export function UserListModal({ visible, onClose, uid, relation, title }: UserListModalProps) {
  const [users, setUsers] = useState<ListedUser[] | null>(null);
  const [openUid, setOpenUid] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !db) return;
    const database = db; // narrowed pra não-nulo aqui fora; os closures abaixo capturam essa constante local
    let cancelled = false;
    setUsers(null);

    getDocs(collection(database, "users", uid, relation))
      .then(async (snap) => {
        const profiles = await Promise.all(
          snap.docs.map(async (relationDoc) => {
            const profileSnap = await getDoc(doc(database, "users", relationDoc.id));
            const data = profileSnap.exists() ? profileSnap.data() : {};
            return {
              uid: relationDoc.id,
              displayName: typeof data.displayName === "string" && data.displayName ? data.displayName : "Alguém",
              avatarId: typeof data.avatarId === "string" ? data.avatarId : DEFAULT_AVATAR_ID,
              frameId: typeof data.frameId === "string" ? data.frameId : DEFAULT_FRAME_ID,
            };
          })
        );
        if (!cancelled) setUsers(profiles);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, uid, relation]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.topButton}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Feather name="chevron-down" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle} accessibilityRole="header">
            {title}
          </Text>
          <View style={styles.topButton} />
        </View>

        {users === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.center}>
            <Feather name="users" size={26} color={colors.textFaint} />
            <Text style={styles.emptyText}>
              {relation === "following" ? "Ainda não segue ninguém." : "Ainda sem seguidores."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setOpenUid(item.uid)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${item.displayName}`}
              >
                <UserAvatar name={item.displayName} avatarId={item.avatarId} frameId={item.frameId} size={40} />
                <Text style={styles.name}>{item.displayName}</Text>
              </Pressable>
            )}
          />
        )}

        <PublicProfileModal uid={openUid} visible={openUid !== null} onClose={() => setOpenUid(null)} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 15,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  list: {
    padding: 20,
  },
  separator: {
    height: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  rowPressed: {
    opacity: 0.6,
  },
  name: {
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
});
