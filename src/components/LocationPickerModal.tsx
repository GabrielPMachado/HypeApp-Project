import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { CityLocation } from "@/types/location";

interface LocationPickerModalProps {
  visible: boolean;
  locations: CityLocation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos pra busca ficar mais tolerante
    .toLowerCase();
}

export function LocationPickerModal({
  visible,
  locations,
  selectedId,
  onSelect,
  onClose,
}: LocationPickerModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return locations;
    return locations.filter((loc) =>
      normalize(`${loc.neighborhood} ${loc.city} ${loc.state}`).includes(q)
    );
  }, [locations, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Escolher região</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Feather name="search" size={15} color={colors.textFaint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Busque por bairro ou cidade"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma região encontrada pra "{query}".</Text>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    handleClose();
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.neighborhood}>{item.neighborhood}</Text>
                    <Text style={styles.city}>
                      {item.city} — {item.state}
                    </Text>
                  </View>

                  {!item.available && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Em breve</Text>
                    </View>
                  )}

                  {isSelected && <Feather name="check" size={16} color={colors.accent} />}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  list: {
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  neighborhood: {
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
  city: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comingSoonText: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textAlign: "center",
    paddingVertical: 24,
  },
});
