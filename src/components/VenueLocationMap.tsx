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
const MAP_WIDTH = 640; // usado só pra pedir a imagem em boa resolução; o <Image> escala pra caber

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

// Mapa estático via Geoapify (100% legítimo: chave gratuita, sem os
// bloqueios de abuso que tile.openstreetmap.org e afins aplicam a apps
// que embutem o tile "cru" sem registro — já apanhamos disso na prática.
// A API desenha o marcador sozinha, então não precisamos mais montar
// mosaico de tiles nem desenhar pin por cima.
export function VenueLocationMap({ latitude, longitude }: VenueLocationMapProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!GEOAPIFY_API_KEY) {
    return (
      <View style={styles.container}>
        <View style={styles.fallback}>
          <Feather name="key" size={18} color={colors.textFaint} />
          <Text style={styles.fallbackText}>
            Configure EXPO_PUBLIC_GEOAPIFY_API_KEY no .env pra ver o mapa
          </Text>
        </View>
      </View>
    );
  }

  const staticMapUrl =
    `https://maps.geoapify.com/v1/staticmap?style=osm-carto` +
    `&width=${MAP_WIDTH}&height=${MAP_HEIGHT * 2}` +
    `&center=lonlat:${longitude},${latitude}&zoom=15` +
    // A API do Geoapify só aceita a cor em minúsculas — "%23E8B24D"
    // (maiúsculo) devolve 400 "does not match any of the allowed types";
    // "%23e8b24d" funciona. Confirmado testando as duas via fetch direto.
    `&marker=lonlat:${longitude},${latitude};color:%23e8b24d;size:large` +
    `&apiKey=${GEOAPIFY_API_KEY}`;

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
        <Image
          source={{ uri: staticMapUrl }}
          style={styles.map}
          onError={(event) => {
            console.warn(
              "[VenueLocationMap] falha ao carregar mapa Geoapify:",
              JSON.stringify(event.nativeEvent)
            );
            setImageFailed(true);
          }}
        />
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
    height: MAP_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    width: "100%",
    height: MAP_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  fallbackText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
    textAlign: "center",
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
