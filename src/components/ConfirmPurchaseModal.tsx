import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Coin } from "@/components/Coin";
import { PressableScale } from "@/components/PressableScale";
import { UserAvatar } from "@/components/UserAvatar";
import { getRarity, RARITY_INFO, type StoreItem } from "@/data/storeCatalog";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface ConfirmPurchaseModalProps {
  item: StoreItem | null;
  coins: number;
  userName: string;
  avatarId?: string | null;
  frameId?: string | null;
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// "Comprar X por N moedas?" — gastar moeda sem confirmar é a receita pra
// compra por engano. Mostra o item aplicado no avatar da própria pessoa e
// o saldo antes/depois.
export function ConfirmPurchaseModal({
  item,
  coins,
  userName,
  avatarId,
  frameId,
  isBusy,
  onConfirm,
  onCancel,
}: ConfirmPurchaseModalProps) {
  const rarity = item ? RARITY_INFO[getRarity(item)] : null;

  return (
    <Modal visible={item !== null} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isBusy ? undefined : onCancel}
          accessibilityLabel="Fechar confirmação"
        />

        {item && rarity && (
          <View style={styles.card} accessibilityViewIsModal>
            <View style={styles.preview}>
              {item.kind === "title" ? (
                <Text style={[styles.titlePreview, { color: item.color }]}>{item.name}</Text>
              ) : (
                <UserAvatar
                  name={userName}
                  avatarId={item.kind === "avatar" ? item.id : avatarId}
                  frameId={item.kind === "frame" ? item.id : frameId}
                  size={88}
                  glow
                />
              )}
            </View>

            <View style={[styles.rarityPill, { borderColor: rarity.color }]}>
              <Text style={[styles.rarityText, { color: rarity.color }]}>{rarity.label}</Text>
            </View>
            {item.kind !== "title" && <Text style={styles.name}>{item.name}</Text>}

            <View style={styles.priceRow}>
              <Coin size={22} />
              <Text style={styles.price}>{item.price}</Text>
            </View>

            <View style={styles.balance}>
              <Text style={styles.balanceText}>Saldo atual: {coins}</Text>
              <Text style={styles.balanceText}>Depois da compra: {coins - item.price}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel="Cancelar compra"
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>

              <PressableScale
                onPress={onConfirm}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={`Comprar ${item.name} por ${item.price} moedas`}
                style={styles.buyButton}
              >
                <Text style={styles.buyText}>{isBusy ? "Comprando..." : "Comprar"}</Text>
              </PressableScale>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
    gap: 10,
  },
  preview: {
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  titlePreview: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    textAlign: "center",
  },
  rarityPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 20,
    fontFamily: fontFamily.display,
    color: colors.text,
    textAlign: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontSize: 26,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  balance: {
    alignSelf: "stretch",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 3,
    marginTop: 4,
  },
  balanceText: {
    fontSize: 12.5,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  buyButton: {
    flex: 1.3,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  buyText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  pressed: {
    opacity: 0.75,
  },
});
