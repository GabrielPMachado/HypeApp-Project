import { collection, getCountFromServer } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { db } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface FollowStatsProps {
  uid: string;
  onPressFollowing: () => void;
  onPressFollowers: () => void;
}

// Contagem via getCountFromServer (agregação nativa do Firestore) em vez
// de ler os documentos todos da subcoleção — o número pode crescer bem
// além do que vale a pena baixar só pra contar.
export function FollowStats({ uid, onPressFollowing, onPressFollowers }: FollowStatsProps) {
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;

    Promise.all([
      getCountFromServer(collection(db, "users", uid, "following")),
      getCountFromServer(collection(db, "users", uid, "followers")),
    ])
      .then(([followingSnap, followerSnap]) => {
        if (cancelled) return;
        setFollowingCount(followingSnap.data().count);
        setFollowerCount(followerSnap.data().count);
      })
      .catch(() => {
        if (!cancelled) {
          setFollowingCount(0);
          setFollowerCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPressFollowing}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel={`Seguindo, ${followingCount ?? 0} pessoas`}
      >
        <Text style={styles.number}>{followingCount ?? "–"}</Text>
        <Text style={styles.label}>Seguindo</Text>
      </Pressable>

      <Pressable
        onPress={onPressFollowers}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel={`Seguidores, ${followerCount ?? 0} pessoas`}
      >
        <Text style={styles.number}>{followerCount ?? "–"}</Text>
        <Text style={styles.label}>Seguidores</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 28,
  },
  item: {
    alignItems: "center",
    gap: 2,
  },
  number: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
});
