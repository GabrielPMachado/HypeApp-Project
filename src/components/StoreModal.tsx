import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedbackModal } from "@/components/FeedbackModal";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import {
  canUseItem,
  DEFAULT_AVATAR_ID,
  DEFAULT_FRAME_ID,
  ITEM_KIND_LABELS,
  itemsOfKind,
  type ItemKind,
  type StoreItem,
} from "@/data/storeCatalog";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

const TABS: ItemKind[] = ["avatar", "frame", "title"];

interface StoreModalProps {
  visible: boolean;
  onClose: () => void;
}

// Loja de cosméticos paga com as moedas do jogo (ver calcCoins). Comprar
// grava spentCoins/inventory de uma vez; as regras do Firestore conferem
// preço, saldo e se o item já não é da pessoa.
export function StoreModal({ visible, onClose }: StoreModalProps) {
  const { profile, displayName, coins, buyItem, saveProfile } = useAuth();
  const [tab, setTab] = useState<ItemKind>("avatar");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string; icon: "check-circle" | "alert-circle" } | null>(null);

  const inventory = profile?.inventory ?? [];
  const equippedId =
    tab === "avatar"
      ? profile?.avatarId ?? DEFAULT_AVATAR_ID
      : tab === "frame"
        ? profile?.frameId ?? DEFAULT_FRAME_ID
        : profile?.titleId ?? null;

  const equip = async (item: StoreItem) => {
    const patch =
      item.kind === "avatar"
        ? { avatarId: item.id }
        : item.kind === "frame"
          ? { frameId: item.id }
          : { titleId: item.id };
    await saveProfile(patch);
  };

  const handlePress = async (item: StoreItem) => {
    if (busyId) return;
    const owned = canUseItem(item, inventory);
    const isEquipped = item.id === equippedId;
    if (isEquipped) return;

    setBusyId(item.id);
    try {
      if (owned) {
        await equip(item);
        return;
      }

      if (coins < item.price) {
        setNotice({
          icon: "alert-circle",
          title: "Moedas insuficientes",
          message: `Faltam ${item.price - coins} moedas pra levar ${item.name}. Mande Hypes e avaliações pra juntar mais!`,
        });
        return;
      }

      await buyItem(item);
      // Compra e equipa de uma vez — quem comprou um avatar quer usar.
      await equip(item);
      setNotice({
        icon: "check-circle",
        title: "Item comprado!",
        message: `${item.name} já está equipado no seu perfil.`,
      });
    } catch (error) {
      console.error("Loja: operação falhou:", error);
      setNotice({
        icon: "alert-circle",
        title: "Não deu pra concluir",
        message: "Tenta de novo em instantes.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = (item: StoreItem) => {
    const owned = canUseItem(item, inventory);
    const isEquipped = item.id === equippedId;
    const affordable = coins >= item.price;
    const previewAvatar = item.kind === "avatar" ? item.id : profile?.avatarId;
    const previewFrame = item.kind === "frame" ? item.id : profile?.frameId;

    let action = `🪙 ${item.price}`;
    if (isEquipped) action = "Equipado";
    else if (owned) action = "Equipar";

    return (
      <Pressable
        key={item.id}
        onPress={() => handlePress(item)}
        disabled={busyId !== null}
        style={({ pressed }) => [
          styles.card,
          isEquipped && styles.cardEquipped,
          pressed && styles.pressed,
        ]}
      >
        {item.kind === "title" ? (
          <View style={styles.titlePreview}>
            <Text style={[styles.titlePreviewText, { color: item.color }]}>{item.name}</Text>
          </View>
        ) : (
          <UserAvatar
            name={displayName}
            avatarId={previewAvatar}
            frameId={previewFrame}
            size={item.kind === "avatar" ? 60 : 52}
          />
        )}

        {item.kind !== "title" && (
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>
        )}

        <View
          style={[
            styles.actionPill,
            isEquipped && styles.actionPillEquipped,
            !owned && !affordable && styles.actionPillDisabled,
          ]}
        >
          <Text
            style={[
              styles.actionText,
              isEquipped && styles.actionTextEquipped,
              !owned && !affordable && styles.actionTextDisabled,
            ]}
          >
            {busyId === item.id ? "..." : action}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.topButton}>
            <Feather name="chevron-down" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>Loja</Text>
          <View style={styles.coinsPill}>
            <Text style={styles.coinsText}>🪙 {coins}</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {TABS.map((kind) => (
            <Pressable
              key={kind}
              onPress={() => setTab(kind)}
              style={[styles.tab, tab === kind && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === kind && styles.tabTextActive]}>
                {ITEM_KIND_LABELS[kind]}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>{itemsOfKind(tab).map(renderItem)}</View>
          <Text style={styles.footnote}>
            Moedas vêm dos seus Hypes (+10) e avaliações (+25). Gastar moedas não faz você perder nível.
          </Text>
        </ScrollView>

        <FeedbackModal
          visible={notice !== null}
          icon={notice?.icon ?? "info"}
          title={notice?.title ?? ""}
          message={notice?.message ?? ""}
          onClose={() => setNotice(null)}
        />
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 15,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  coinsPill: {
    minWidth: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
  },
  coinsText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tabActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.accent,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "31%",
    flexGrow: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  cardEquipped: {
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
  cardName: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    textAlign: "center",
    minHeight: 30,
  },
  titlePreview: {
    minHeight: 60,
    justifyContent: "center",
  },
  titlePreviewText: {
    fontSize: 14,
    fontFamily: fontFamily.display,
    textAlign: "center",
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  actionPillEquipped: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionPillDisabled: {
    backgroundColor: colors.borderStrong,
  },
  actionText: {
    fontSize: 12,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  actionTextEquipped: {
    color: colors.accent,
  },
  actionTextDisabled: {
    color: colors.textMuted,
  },
  footnote: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textAlign: "center",
    lineHeight: 18,
  },
});
