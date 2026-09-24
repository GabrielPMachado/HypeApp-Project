import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { LegalDocument } from "@/constants/legalContent";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  document: LegalDocument;
}

// Renderiza Política de Privacidade e Termos de Uso a partir do conteúdo
// estruturado em legalContent.ts — embutido no app (não um link externo)
// pra continuar acessível offline e não depender de terceiro pra cumprir
// uma exigência legal.
export function LegalModal({ visible, onClose, document }: LegalModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.topButton} />
          <Text style={styles.topTitle} accessibilityRole="header" numberOfLines={1}>
            {document.title}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.topButton}
            accessibilityRole="button"
            accessibilityLabel={`Fechar ${document.title}`}
          >
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.updatedAt}>Última atualização: {document.updatedAt}</Text>
          <Text style={styles.intro}>{document.intro}</Text>

          {document.facts && (
            <View style={styles.factsGrid}>
              {document.facts.map((fact) => (
                <View key={fact.label} style={styles.factCard}>
                  <Text style={styles.factLabel}>{fact.label}</Text>
                  <Text style={[styles.factValue, fact.good && styles.factValueGood]}>
                    {fact.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {document.sections.map((section, index) => (
            <View key={section.heading} style={styles.section}>
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionNo}>{String(index + 1).padStart(2, "0")}</Text>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
              </View>

              {section.paragraphs?.map((paragraph, i) => (
                <Text key={i} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}

              {section.bullets?.map((bullet, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}

              {section.items?.map((item) => (
                <View key={item.label} style={styles.itemCard}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                </View>
              ))}

              {section.tags && (
                <>
                  {section.tagsIntro && <Text style={styles.tagsIntro}>{section.tagsIntro}</Text>}
                  <View style={styles.tagsRow}>
                    {section.tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>— {tag}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {section.warning && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>{section.warning}</Text>
                </View>
              )}
            </View>
          ))}

          <Text style={styles.footer}>{document.footer}</Text>
        </ScrollView>
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
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 4,
  },
  updatedAt: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    marginBottom: 10,
  },
  intro: {
    fontSize: 15,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 20,
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
  },
  factCard: {
    flexBasis: "50%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  factLabel: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  factValue: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    lineHeight: 17,
  },
  factValueGood: {
    color: colors.hypeLow,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 10,
  },
  sectionNo: {
    fontSize: 11,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
  sectionHeading: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: colors.textFaint,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    lineHeight: 21,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemLabel: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    lineHeight: 19,
  },
  tagsIntro: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11.5,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  warningBox: {
    backgroundColor: colors.hypeHighMuted,
    borderWidth: 1,
    borderColor: colors.hypeHigh,
    borderRadius: 14,
    padding: 16,
  },
  warningText: {
    fontSize: 13.5,
    fontFamily: fontFamily.body,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    lineHeight: 18,
    marginTop: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
