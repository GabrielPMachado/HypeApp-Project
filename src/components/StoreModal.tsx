import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Coin } from "@/components/Coin";
import { ConfirmPurchaseModal } from "@/components/ConfirmPurchaseModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { PressableScale } from "@/components/PressableScale";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import {
  canUseItem,
  DEFAULT_AVATAR_ID,
  DEFAULT_FRAME_ID,
  getRarity,
  ITEM_KIND_LABELS,
  itemsOfKind,
  RARITY_INFO,
  type ItemKind,
  type StoreItem,
} from "@/data/storeCatalog";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { haptics } from "@/utils/haptics";

const TABS: ItemKind[] = ["avatar", "frame", "title"];

interface StoreModalProps {
  visible: boolean;
  onClose: () => void;
}

type Notice = { title: string; message: string; icon: "check-circle" | "alert-circle" };

// Loja de cosméticos paga com as moedas do jogo (ver calcCoins). Comprar
// grava spentCoins/inventory de uma vez; as regras do Firestore conferem
// preço, saldo e se o item já não é da pessoa.
export function StoreModal({ visible, onClose }: StoreModalProps) {
  const { profile, displayName, coins, buyItem, saveProfile } = useAuth();
  const [tab, setTab] = useState<ItemKind>("avatar");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<StoreItem | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

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

  const fail = (error: unknown) => {
    console.error("Loja: operação falhou:", error);
    haptics.warning();
    setNotice({
      icon: "alert-circle",
      title: "Não deu pra concluir",
      message: "Tenta de novo em instantes.",
    });
  };

  const handlePress = async (item: StoreItem) => {
    if (busyId || item.id === equippedId) return;

    // Já é da pessoa: só equipa.
    if (canUseItem(item, inventory)) {
      setBusyId(item.id);
      try {
        await equip(item);
        haptics.tap();
      } catch (error) {
        fail(error);
      } finally {
        setBusyId(null);
      }
      return;
    }

    if (coins < item.price) {
      haptics.warning();
      setNotice({
        icon: "alert-circle",
        title: "Moedas insuficientes",
        message: `Faltam ${item.price - coins} moedas pra levar ${item.name}. Mande Hypes e avaliações pra juntar mais!`,
      });
      return;
    }

    haptics.tap();
    setPending(item);
  };

  const handleConfirm = async () => {
    if (!pending || busyId) return;
    const item = pending;
    setBusyId(item.id);
    try {
      await buyItem(item);
      // Compra e equipa de uma vez — quem comprou quer usar.
      await equip(item);
      haptics.success();
      setPending(null);
      setNotice({
        icon: "check-circle",
        title: "Item comprado!",
        message: `${item.name} já está equipado no seu perfil.`,
      });
    } catch (error) {
      setPending(null);
      fail(error);
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = (item: StoreItem) => {
    const owned = canUseItem(item, inventory);
    const isEquipped = item.id === equippedId;
    const affordable = coins >= item.price;
    const rarity = RARITY_INFO[getRarity(item)];
    const previewAvatar = item.kind === "avatar" ? item.id : profile?.avatarId;
    const previewFrame = item.kind === "frame" ? item.id : profile?.frameId;

    const stateLabel = isEquipped ? "equipado" : owned ? "disponível para equipar" : `custa ${item.price} moedas`;

    return (
      <PressableScale
        key={item.id}
        onPress={() => handlePress(item)}
        disabled={busyId !== null}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${rarity.label}, ${stateLabel}`}
        accessibilityState={{ selected: isEquipped, disabled: busyId !== null }}
        style={[styles.card, isEquipped && styles.cardEquipped]}
      >
        {/* Faixa de raridade no topo do card */}
        <LinearGradient
          colors={[`${rarity.color}44`, "transparent"]}
          style={styles.rarityGlow}
          pointerEvents="none"
        />

        <Text style={[styles.rarityLabel, { color: rarity.color }]}>{rarity.label}</Text>

        {item.kind === "title" ? (
          <View style={styles.titlePreview}>
            <Text style={[styles.titlePreviewText, { color: item.color }]} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
        ) : (
          <UserAvatar
            name={displayName}
            avatarId={previewAvatar}
            frameId={previewFrame}
            size={item.kind === "avatar" ? 62 : 54}
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
          {!owned && <Coin size={15} />}
          <Text
            style={[
              styles.actionText,
              isEquipped && styles.actionTextEquipped,
              !owned && !affordable && styles.actionTextDisabled,
            ]}
          >
            {busyId === item.id ? "..." : isEquipped ? "Equipado" : owned ? "Equipar" : item.price}
          </Text>
        </View>
      </PressableScale>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.topButton}
            accessibilityRole="button"
            accessibilityLabel="Fechar a loja"
          >
            <Feather name="chevron-down" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle} accessibilityRole="header">
            Loja
          </Text>
          <View style={styles.coinsPill} accessible accessibilityLabel={`Saldo: ${coins} moedas`}>
            <Coin size={20} />
            <Text style={styles.coinsText}>{coins}</Text>
          </View>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((kind) => {
            const selected = tab === kind;
            return (
              <Pressable
                key={kind}
                onPress={() => {
                  haptics.tap();
                  setTab(kind);
                }}
                style={[styles.tab, selected && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={ITEM_KIND_LABELS[kind]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                  {ITEM_KIND_LABELS[kind]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>{itemsOfKind(tab).map(renderItem)}</View>
          <Text style={styles.footnote}>
            Moedas vêm dos seus Hypes (+10) e avaliações (+25). Gastar moedas não faz você perder nível.
          </Text>
        </ScrollView>

        <ConfirmPurchaseModal
          item={pending}
          coins={coins}
          userName={displayName}
          avatarId={profile?.avatarId}
          frameId={profile?.frameId}
          isBusy={busyId !== null}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />

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
    paddingVertical: 6,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  coinsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 44,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coinsText: {
    fontSize: 14,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
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
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  cardEquipped: {
    borderColor: colors.accent,
  },
  rarityGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  rarityLabel: {
    fontSize: 9.5,
    fontFamily: fontFamily.bodySemiBold,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  cardName: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    textAlign: "center",
    minHeight: 30,
  },
  titlePreview: {
    minHeight: 62,
    justifyContent: "center",
  },
  titlePreviewText: {
    fontSize: 14,
    fontFamily: fontFamily.display,
    textAlign: "center",
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
