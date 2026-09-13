import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface VenueLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const MAP_HEIGHT = 160;
const PIN_SIZE = 30;

// Mapa estático (sem API key) via Wikimedia Maps — infraestrutura da
// Wikimedia Foundation, bem mais estável que serviços não-oficiais.
// O serviço não desenha marcador, então sobrepomos um pin próprio
// exatamente no centro da imagem (que é sempre o ponto "center=lat,lon").
// Toque no card abre a localização no app de mapas nativo do aparelho.
// Um mapa nativo interativo (react-native-maps) exigiria API key do
// Google Maps e um build customizado fora do Expo Go — próxima etapa.
export function VenueLocationMap({ latitude, longitude, address }: VenueLocationMapProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const staticMapUrl = `https://maps.wikimedia.org/img/osm-intl,16,${latitude},${longitude},640x${
    MAP_HEIGHT * 2
  }.png`;

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Pressable onPress={openInMaps} style={styles.container}>
      {imageFailed ? (
        <View style={styles.fallback}>
          <Feather name="map" size={20} color={colors.textFaint} />
          <Text style={styles.fallbackText}>Mapa indisponível no momento</Text>
        </View>
      ) : (
        <>
          <Image
            source={{ uri: staticMapUrl }}
            style={styles.map}
            onError={() => setImageFailed(true)}
          />
          <View pointerEvents="none" style={styles.pinWrap}>
            <Feather name="map-pin" size={PIN_SIZE} color={colors.accent} />
          </View>
        </>
      )}

      <View style={styles.overlay}>
        <Feather name="navigation" size={13} color={colors.text} />
        <Text style={styles.overlayText} numberOfLines={1}>
          Abrir no mapa
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: {
    width: "100%",
    height: MAP_HEIGHT,
    backgroundColor: colors.surfaceRaised,
  },
  pinWrap: {
    position: "absolute",
    top: MAP_HEIGHT / 2 - PIN_SIZE,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fallback: {
    width: "100%",
    height: MAP_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fallbackText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  overlay: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10, 10, 13, 0.85)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlayText: {
    fontSize: 11,
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
  },
});
