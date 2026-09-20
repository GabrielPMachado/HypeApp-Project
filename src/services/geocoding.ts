import type { CityLocation } from "@/types/location";
import { distanceKm } from "@/utils/geo";

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

// Raio mínimo: uma rua ou um bar específico têm caixa delimitadora
// minúscula, mas quem busca por eles quer ver os bares do entorno, não
// só os que estão exatamente ali. Raio máximo: só pra uma cidade enorme
// não varrer meio estado.
const MIN_RADIUS_KM = 0.8;
const MAX_RADIUS_KM = 30;

export type GeocodedPlace = Omit<CityLocation, "id">;

// bbox do Geoapify = [lonMin, latMin, lonMax, latMax]. O raio é metade da
// diagonal, pra cobrir a área inteira do lugar: uma cidade pega a cidade
// toda, um bairro pega o bairro, uma rua só o entorno (raio mínimo).
function radiusFromBbox(bbox: unknown): number {
  if (!Array.isArray(bbox) || bbox.length < 4) return MIN_RADIUS_KM;
  const [lonMin, latMin, lonMax, latMax] = bbox as number[];
  const halfDiagonal =
    distanceKm({ latitude: latMin, longitude: lonMin }, { latitude: latMax, longitude: lonMax }) / 2;
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, halfDiagonal));
}

// Geocodifica o texto digitado (mesma chave do mapa estático em
// VenueLocationMap.tsx) pra achar coordenadas reais de QUALQUER lugar —
// rua, bairro ou cidade — tenha ou não bar cadastrado ali.
//
// "near" (a região que a pessoa já está olhando) entra como viés de
// proximidade: nomes de rua se repetem pelo país todo, e sem isso
// "Rua Padre Chagas" resolve pra Novo Hamburgo em vez de Porto Alegre.
// filter=countrycode:br porque o app é só pro Brasil.
//
// Falha em silêncio (sem chave, sem rede, lugar não encontrado): quem
// chama trata `null` como "não achei".
export async function geocodePlace(
  text: string,
  near?: { latitude: number; longitude: number }
): Promise<GeocodedPlace | null> {
  if (!GEOAPIFY_API_KEY) return null;

  try {
    // Query montada na mão: o URLSearchParams do React Native historicamente
    // não implementa .set()/.get() (lança "not implemented").
    const query = [
      `text=${encodeURIComponent(text)}`,
      "filter=countrycode:br",
      "limit=1",
      `apiKey=${GEOAPIFY_API_KEY}`,
    ];
    if (near) query.push(`bias=${encodeURIComponent(`proximity:${near.longitude},${near.latitude}`)}`);

    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${query.join("&")}`);
    if (!response.ok) return null;

    const feature = (await response.json())?.features?.[0];
    const props = feature?.properties;
    if (typeof props?.lat !== "number" || typeof props?.lon !== "number") return null;

    // Uma cidade não tem "cidade" acima dela — o complemento do nome é o
    // estado (ex: "Ipanema, MG"); rua e bairro mostram a cidade.
    const isCity = props.result_type === "city";
    return {
      name: props.name ?? text,
      city: isCity ? "" : (props.city ?? ""),
      state: isCity ? (props.state_code ?? "") : "",
      latitude: props.lat,
      longitude: props.lon,
      radiusKm: radiusFromBbox(feature.bbox),
    };
  } catch {
    return null;
  }
}
