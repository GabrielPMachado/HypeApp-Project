import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FeedbackModal } from "@/components/FeedbackModal";
import { useAuth } from "@/context/AuthContext";
import { useVenues } from "@/context/VenuesContext";
import { isFirebaseConfigured } from "@/services/firebase";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { VenuePhoto } from "@/types/venue";
import { formatRelativeTime } from "@/utils/time";

const THUMB_SIZE = 76;

// Desligado enquanto o Firebase Storage não estiver ativo no projeto (exige
// o plano Blaze) e as regras de venue-photos publicadas — sem isso o envio
// sempre falha. Ligar de novo é só trocar pra true.
const PHOTOS_ENABLED = false;

interface VenuePhotosSectionProps {
  venueId: string;
  photos: VenuePhoto[];
}

// Galeria de fotos do bar mandadas pela comunidade (ver uploadVenuePhoto
// em VenuesContext.tsx) — sem Storage configurado o botão de adicionar
// some, já que não teria onde persistir o arquivo de verdade.
export function VenuePhotosSection({ venueId, photos }: VenuePhotosSectionProps) {
  const { user } = useAuth();
  const { uploadVenuePhoto, deleteVenuePhoto } = useVenues();
  const [isUploading, setUploading] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<VenuePhoto | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!PHOTOS_ENABLED || !isFirebaseConfigured) return null;

  const handleAdd = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage("Preciso de acesso às suas fotos pra mandar uma foto do local.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      await uploadVenuePhoto(venueId, result.assets[0].uri);
    } catch {
      setErrorMessage("Não deu pra enviar a foto agora. Tenta de novo em instantes.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!viewerPhoto) return;
    setDeleting(true);
    try {
      await deleteVenuePhoto(venueId, viewerPhoto);
      setViewerPhoto(null);
    } catch {
      setErrorMessage("Não deu pra apagar a foto agora. Tenta de novo em instantes.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Fotos {photos.length > 0 ? `(${photos.length})` : ""}
      </Text>
      <Text style={styles.sectionHint}>
        Ficam públicas pra qualquer usuário logado — evite fotos com pessoas identificáveis sem o
        consentimento delas ou com documentos/dados pessoais visíveis.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          onPress={handleAdd}
          disabled={isUploading}
          accessibilityRole="button"
          accessibilityLabel="Adicionar foto do local"
          style={({ pressed }) => [styles.addTile, pressed && styles.pressed]}
        >
          {isUploading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Feather name="camera" size={20} color={colors.accent} />
              <Text style={styles.addTileText}>Adicionar</Text>
            </>
          )}
        </Pressable>

        {photos.map((photo) => (
          <Pressable
            key={photo.id}
            onPress={() => setViewerPhoto(photo)}
            accessibilityRole="button"
            accessibilityLabel={`Ver foto enviada por ${photo.authorName}`}
          >
            <Image source={{ uri: photo.url }} style={styles.thumb} />
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={viewerPhoto !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setViewerPhoto(null)}
      >
        <View style={styles.viewerBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setViewerPhoto(null)}
            accessibilityLabel="Fechar foto"
          />

          {viewerPhoto && (
            <View style={styles.viewerCard}>
              <Image source={{ uri: viewerPhoto.url }} style={styles.viewerImage} resizeMode="contain" />
              <View style={styles.viewerFooter}>
                <Text style={styles.viewerCaption}>
                  Por {viewerPhoto.authorName} · {formatRelativeTime(viewerPhoto.createdAt)}
                </Text>
                {viewerPhoto.authorId === user?.uid && (
                  <Pressable
                    onPress={handleDelete}
                    disabled={isDeleting}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Apagar esta foto"
                  >
                    <Feather name="trash-2" size={16} color={colors.hypeHigh} />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          <Pressable
            onPress={() => setViewerPhoto(null)}
            hitSlop={8}
            style={styles.viewerClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>
        </View>
      </Modal>

      <FeedbackModal
        visible={errorMessage !== ""}
        icon="alert-circle"
        title="Não deu pra continuar"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  sectionHint: {
    fontSize: 11.5,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    lineHeight: 16,
  },
  row: {
    gap: 10,
  },
  addTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addTileText: {
    fontSize: 10,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  viewerCard: {
    width: "100%",
    gap: 10,
  },
  viewerImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
  viewerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerCaption: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
