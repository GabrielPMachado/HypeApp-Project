import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface VenueLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const MAP_HEIGHT = 160;
const ZOOM = 16;
const TILE_SIZE = 256;
const PIN_SIZE = 30;

// As "static map APIs" prontas (staticmap.openstreetmap.de, Wikimedia
// Maps) se mostraram pouco confiáveis na prática: uma parou de resolver
// DNS, a outra devolve 403 (bloqueia hotlink de apps fora do domínio da
// Wikimedia — testado e confirmado). tile.openstreetmap.org é o servidor
// de tiles "cru" por trás de praticamente todo app com OSM e respondeu
// 200 nos testes, então montamos o mosaico de tiles na mão (só <Image>,
// sem lib de mapa) e desenhamos o pin por cima, sempre no centro exato.
function lonLatToWorldPixel(lat: number, lon: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

interface Tile {
  key: string;
  uri: string;
  left: number;
  top: number;
}

function buildTiles(lat: number, lon: number, width: number, height: number): Tile[] {
  const { x: centerX, y: centerY } = lonLatToWorldPixel(lat, lon, ZOOM);
  const originX = centerX - width / 2;
  const originY = centerY - height / 2;
  const numTiles = 2 ** ZOOM;

  const firstTileX = Math.floor(originX / TILE_SIZE);
  const firstTileY = Math.floor(originY / TILE_SIZE);
  const lastTileX = Math.floor((originX + width) / TILE_SIZE);
  const lastTileY = Math.floor((originY + height) / TILE_SIZE);

  const tiles: Tile[] = [];
  for (let tx = firstTileX; tx <= lastTileX; tx++) {
    for (let ty = firstTileY; ty <= lastTileY; ty++) {
      const wrappedX = ((tx % numTiles) + numTiles) % numTiles;
      tiles.push({
        key: `${tx}-${ty}`,
        uri: `https://tile.openstreetmap.org/${ZOOM}/${wrappedX}/${ty}.png`,
        left: tx * TILE_SIZE - originX,
        top: ty * TILE_SIZE - originY,
      });
    }
  }
  return tiles;
}

export function VenueLocationMap({ latitude, longitude }: VenueLocationMapProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [failedTiles, setFailedTiles] = useState<Record<string, boolean>>({});

  const tiles = useMemo(
    () => (containerWidth > 0 ? buildTiles(latitude, longitude, containerWidth, MAP_HEIGHT) : []),
    [containerWidth, latitude, longitude]
  );

  const allFailed = tiles.length > 0 && tiles.every((tile) => failedTiles[tile.key]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width > 0 && width !== containerWidth) setContainerWidth(width);
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Pressable onPress={openInMaps} style={styles.container} onLayout={handleLayout}>
      {allFailed ? (
        <View style={styles.fallback}>
          <Feather name="map" size={20} color={colors.textFaint} />
          <Text style={styles.fallbackText}>Mapa indisponível no momento</Text>
        </View>
      ) : (
        <View style={styles.tilesWrap}>
          {tiles.map((tile) => (
            <Image
              key={tile.key}
              source={{
                uri: tile.uri,
                // OSM pede User-Agent identificando o app (não bloqueia,
                // mas evita cair em heurísticas de bloqueio de tráfego
                // anônimo). Também ajuda a descartar essa causa no diagnóstico.
                headers: { "User-Agent": "HypeApp-dev/1.0 (app de teste, uso local)" },
              }}
              style={[styles.tile, { left: tile.left, top: tile.top }]}
              onError={(event) => {
                console.warn(
                  "[VenueLocationMap] tile falhou:",
                  tile.uri,
                  JSON.stringify(event.nativeEvent)
                );
                setFailedTiles((prev) => ({ ...prev, [tile.key]: true }));
              }}
            />
          ))}
          <View pointerEvents="none" style={styles.pinWrap}>
            <Feather name="map-pin" size={PIN_SIZE} color={colors.accent} />
          </View>
        </View>
      )}

      <View style={styles.overlay}>
        <Feather name="navigation" size={13} color={colors.text} />
        <Text style={styles.overlayText} numberOfLines={1}>
          Abrir no mapa
        </Text>
      </View>

      <Text style={styles.attribution}>© OpenStreetMap</Text>
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
  tilesWrap: {
    width: "100%",
    height: "100%",
  },
  tile: {
    position: "absolute",
    width: TILE_SIZE,
    height: TILE_SIZE,
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
  attribution: {
    position: "absolute",
    left: 8,
    bottom: 6,
    fontSize: 9,
    fontFamily: fontFamily.body,
    color: "rgba(255, 255, 255, 0.6)",
  },
});
