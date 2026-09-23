import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Coin } from "@/components/Coin";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth, type ProfilePatch } from "@/context/AuthContext";
import { ALL_VIBE_TAGS, VIBE_TAG_LABELS } from "@/constants/vibeTags";
import {
  canUseItem,
  DEFAULT_AVATAR_ID,
  DEFAULT_FRAME_ID,
  getItem,
  itemsOfKind,
  type StoreItem,
} from "@/data/storeCatalog";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { VibeTag } from "@/types/venue";
import { calcPoints, getLevelInfo } from "@/utils/gamification";
import { haptics } from "@/utils/haptics";
import { getModerationIssue, moderationMessage } from "@/utils/moderation";

const NAME_MIN = 2;
const NAME_MAX = 30;
const BIO_MAX = 140;
const VIBES_MAX = 5;

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  // Toque num item bloqueado leva pra loja (quando ela existe).
  onOpenStore?: () => void;
}

export function EditProfileModal({ visible, onClose, onOpenStore }: EditProfileModalProps) {
  const { profile, displayName, saveProfile } = useAuth();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [vibes, setVibes] = useState<VibeTag[]>([]);
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [frameId, setFrameId] = useState(DEFAULT_FRAME_ID);
  const [titleId, setTitleId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setSaving] = useState(false);

  // Recarrega o formulário com o perfil atual toda vez que abre (descarta
  // edição não salva de uma abertura anterior).
  useEffect(() => {
    if (!visible) return;
    setName(profile?.displayName || displayName);
    setBio(profile?.bio ?? "");
    setVibes(profile?.favoriteVibes ?? []);
    setAvatarId(profile?.avatarId ?? DEFAULT_AVATAR_ID);
    setFrameId(profile?.frameId ?? DEFAULT_FRAME_ID);
    setTitleId(profile?.titleId ?? null);
    setError("");
  }, [visible]);

  const inventory = profile?.inventory ?? [];

  const trimmedName = name.trim();
  const nameValid = trimmedName.length >= NAME_MIN && trimmedName.length <= NAME_MAX;
  const nameIssue = getModerationIssue(name);
  const bioIssue = getModerationIssue(bio);

  const patch: ProfilePatch = {};
  if (trimmedName !== (profile?.displayName ?? "")) patch.displayName = trimmedName;
  if (bio.trim() !== (profile?.bio ?? "")) patch.bio = bio.trim();
  if (vibes.join() !== (profile?.favoriteVibes ?? []).join()) patch.favoriteVibes = vibes;
  if (avatarId !== (profile?.avatarId ?? DEFAULT_AVATAR_ID)) patch.avatarId = avatarId;
  if (frameId !== (profile?.frameId ?? DEFAULT_FRAME_ID)) patch.frameId = frameId;
  if (titleId !== (profile?.titleId ?? null)) patch.titleId = titleId;
  const hasChanges = Object.keys(patch).length > 0;
  const canSave = hasChanges && nameValid && !nameIssue && !bioIssue && !isSaving;

  // Título mostrado na prévia: o escolhido ou, sem escolha, o do nível.
  const levelTitle = getLevelInfo(
    calcPoints({
      hypeReportCount: profile?.hypeReportCount ?? 0,
      reviewCount: profile?.reviewCount ?? 0,
    })
  ).title;
  const chosenTitle = getItem(titleId);
  const previewTitle = { label: chosenTitle?.name ?? levelTitle, color: chosenTitle?.color ?? colors.accent };

  const toggleVibe = (tag: VibeTag) => {
    setVibes((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      return prev.length >= VIBES_MAX ? prev : [...prev, tag];
    });
  };

  const handleItemPress = (item: StoreItem) => {
    if (!canUseItem(item, inventory)) {
      onOpenStore?.();
      return;
    }
    if (item.kind === "avatar") setAvatarId(item.id);
    else if (item.kind === "frame") setFrameId(item.id);
    else setTitleId(item.id);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setError("");
    setSaving(true);
    try {
      await saveProfile(patch);
      haptics.confirm();
      onClose();
    } catch (saveError) {
      console.error("Perfil: não consegui salvar:", saveError);
      haptics.warning();
      setError("Não deu pra salvar agora. Tenta de novo em instantes.");
    } finally {
      setSaving(false);
    }
  };

  const renderItemCell = (item: StoreItem, selected: boolean) => {
    const locked = !canUseItem(item, inventory);
    const previewAvatar = item.kind === "avatar" ? item.id : avatarId;
    const previewFrame = item.kind === "frame" ? item.id : frameId;

    return (
      <Pressable
        key={item.id}
        onPress={() => {
          haptics.tap();
          handleItemPress(item);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}${locked ? `, bloqueado, custa ${item.price} moedas` : ""}`}
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.cell, selected && styles.cellSelected, pressed && styles.pressed]}
      >
        {item.kind === "title" ? (
          <View style={styles.titleCellIcon}>
            <Feather name="type" size={20} color={locked ? colors.textFaint : item.color} />
          </View>
        ) : (
          <View style={locked && styles.lockedPreview}>
            <UserAvatar
              name={name}
              avatarId={previewAvatar}
              frameId={previewFrame}
              size={item.kind === "avatar" ? 52 : 44}
            />
          </View>
        )}
        <Text style={[styles.cellLabel, locked && styles.cellLabelLocked]} numberOfLines={2}>
          {item.name}
        </Text>
        {locked && (
          <View style={styles.lockRow}>
            <Coin size={13} />
            <Text style={styles.lockText}>{item.price}</Text>
          </View>
        )}
      </Pressable>
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
            accessibilityLabel="Fechar sem salvar"
          >
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle} accessibilityRole="header">
            Editar perfil
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={8}
            style={styles.saveButton}
            accessibilityRole="button"
            accessibilityLabel="Salvar alterações"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Text>
          </Pressable>
        </View>

        {/* Prévia fixa: fica à vista enquanto a pessoa rola e escolhe. */}
        <View style={styles.previewBar}>
          <UserAvatar name={name} avatarId={avatarId} frameId={frameId} size={60} glow />
          <View style={styles.previewText}>
            <Text style={styles.previewName} numberOfLines={1}>
              {trimmedName || "Seu nome"}
            </Text>
            <Text style={[styles.previewTitle, { color: previewTitle.color }]} numberOfLines={1}>
              {previewTitle.label}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                maxLength={NAME_MAX}
                placeholder="Como você quer ser chamado"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="words"
              />
              {!nameValid && name.length > 0 && (
                <Text style={styles.hintError}>O nome precisa ter entre {NAME_MIN} e {NAME_MAX} letras.</Text>
              )}
              {nameValid && nameIssue && (
                <Text style={styles.hintError}>{moderationMessage(nameIssue, "do nome")}</Text>
              )}
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Bio</Text>
                <Text style={styles.counter}>
                  {bio.length}/{BIO_MAX}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                maxLength={BIO_MAX}
                placeholder="Conta um pouco sobre você e o seu rolê ideal"
                placeholderTextColor={colors.textFaint}
                multiline
              />
              {bioIssue && <Text style={styles.hintError}>{moderationMessage(bioIssue, "da bio")}</Text>}
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Estilos favoritos</Text>
                <Text style={styles.counter}>
                  {vibes.length}/{VIBES_MAX}
                </Text>
              </View>
              <View style={styles.chipsGrid}>
                {ALL_VIBE_TAGS.map((tag) => {
                  const selected = vibes.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => {
                        haptics.tap();
                        toggleVibe(tag);
                      }}
                      accessibilityRole="checkbox"
                      accessibilityLabel={VIBE_TAG_LABELS[tag]}
                      accessibilityState={{ checked: selected }}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {VIBE_TAG_LABELS[tag]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Avatar</Text>
              <View style={styles.grid}>
                {itemsOfKind("avatar").map((item) => renderItemCell(item, item.id === avatarId))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Moldura</Text>
              <View style={styles.grid}>
                {itemsOfKind("frame").map((item) => renderItemCell(item, item.id === frameId))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Título</Text>
              <View style={styles.grid}>
                <Pressable
                  onPress={() => {
                    haptics.tap();
                    setTitleId(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Usar o título do meu nível"
                  accessibilityState={{ selected: titleId === null }}
                  style={({ pressed }) => [
                    styles.cell,
                    titleId === null && styles.cellSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.titleCellIcon}>
                    <Feather name="award" size={20} color={colors.accent} />
                  </View>
                  <Text style={styles.cellLabel} numberOfLines={2}>
                    Do meu nível
                  </Text>
                </Pressable>
                {itemsOfKind("title").map((item) => renderItemCell(item, item.id === titleId))}
              </View>
            </View>

            {error.length > 0 && <Text style={styles.hintError}>{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  saveButton: {
    minWidth: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  saveTextDisabled: {
    color: colors.textFaint,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 22,
  },
  previewBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  previewText: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    fontSize: 18,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  previewTitle: {
    fontSize: 12.5,
    fontFamily: fontFamily.bodySemiBold,
    letterSpacing: 0.3,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textFaint,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  counter: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  bioInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  hintError: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.hypeHigh,
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.accent,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },
  cell: {
    width: "25%",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cellSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  lockedPreview: {
    opacity: 0.35,
  },
  titleCellIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellLabel: {
    fontSize: 10.5,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    textAlign: "center",
  },
  cellLabelLocked: {
    color: colors.textFaint,
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockText: {
    fontSize: 10,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textFaint,
  },
  pressed: {
    opacity: 0.75,
  },
});
